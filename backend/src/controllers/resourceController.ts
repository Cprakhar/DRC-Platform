import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import logger from '../utils/logger';
import { getIO } from '../utils/socket';
import axios from 'axios';

const RESOURCE_RADIUS_METERS = 10000; // 10km
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// GET /disasters/:id/resources?lat=...&lon=...
export const getNearbyResources = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    logger.warn({ event: 'resource_lookup_missing_coords', query: req.query });
    return res.status(400).json({ error: 'Missing lat/lon query parameters' });
  }
  const radius = RESOURCE_RADIUS_METERS; // 10km default
  const cacheKey = `resources:${id}:${lat}:${lon}:${radius}`;
  // 1. Check Supabase cache
  const { data: cacheData } = await supabase
    .from('cache')
    .select('value, expires_at')
    .eq('key', cacheKey)
    .single();
  const now = new Date();
  if (cacheData && new Date(cacheData.expires_at) > now) {
    logger.info({ event: 'resource_cache_hit', disaster_id: id, lat, lon });
    const resources = cacheData.value.resources || [];
    return res.json({ resources, cached: true });
  }
  // 2. Geospatial query for resources using Postgres function
  try {
    const { data, error } = await supabase.rpc('get_nearby_resources', {
      disaster_id: id,
      lat: parseFloat(lat as string),
      lon: parseFloat(lon as string),
      radius: radius
    });
    if (error) {
      logger.error({ event: 'resource_query_error', error: error.message, disaster_id: id });
      return res.status(500).json({ error: error.message });
    }
    const resources = data || [];
    // 3. Store in cache
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: { resources },
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString()
    });
    logger.info({ event: 'resource_query_success', disaster_id: id, count: resources.length });
    getIO().emit('resources_updated', { disaster_id: id, resources });
    res.json({ resources });
  } catch (err: any) {
    logger.error({ event: 'resource_query_exception', disaster_id: id, error: err.message });
    res.status(500).json({ error: 'Resource lookup failed' });
  }
};

// POST /disasters/:id/resources (admin only)
export const createResource = async (req: Request, res: Response) => {
  const { id } = req.params; // disaster id
  const { name, type, location } = req.body;
  if (!name || !type || !location || !location.type || !location.coordinates) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Insert as geography(Point, 4326)
  const point = `SRID=4326;POINT(${location.coordinates[0]} ${location.coordinates[1]})`;
  const { data, error } = await supabase.from('resources').insert([
    {
      disaster_id: id,
      name,
      type,
      location: point
    }
  ]).select().single();
  if (error) {
    logger.error({ event: 'resource_create_error', error: error.message });
    return res.status(500).json({ error: error.message });
  }
  logger.info({ event: 'resource_created', id: data.id });
  getIO().emit('resources_updated', { disaster_id: id });
  res.status(201).json(data);
};

// DELETE /disasters/:id/resources/:rid (admin only)
export const deleteResource = async (req: Request, res: Response) => {
  const { id, rid } = req.params;
  const { data, error } = await supabase.from('resources').delete().eq('id', rid).eq('disaster_id', id).select().single();
  if (error) {
    logger.error({ event: 'resource_delete_error', error: error.message });
    return res.status(500).json({ error: error.message });
  }
  logger.info({ event: 'resource_deleted', id: rid });
  getIO().emit('resources_updated', { disaster_id: id });
  res.json({ message: 'Deleted', id: rid });
};

// GET /resources (admin only)
export const getAllResources = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('resources_geojson').select('*');
    if (error) {
      logger.error({ event: 'resource_list_error', error: error.message });
      return res.status(500).json({ error: error.message });
    }
    res.json({ resources: data || [] });
  } catch (err: any) {
    logger.error({ event: 'resource_list_exception', error: err.message });
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

// Utility to auto-populate resources for a disaster (no Express req/res dependency)
export async function autoPopulateResourcesForDisasterId(id: string): Promise<{ inserted?: any[]; message?: string; error?: string }> {
  // 1. Get disaster location as GeoJSON
  const { data: disaster, error: disasterError } = await supabase
    .from('disasters_geojson')
    .select('id, location')
    .eq('id', id)
    .single();
  if (disasterError || !disaster) {
    logger.warn({ event: 'auto_populate_no_disaster', id, error: disasterError?.message });
    return { error: 'Disaster not found' };
  }
  let coordinates = disaster.location?.coordinates;
  if (!coordinates) {
    return { error: 'Disaster location missing or invalid' };
  }
  const [lon, lat] = coordinates;
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|shelter|pharmacy|police|fire_station"](around:10000,${lat},${lon});
      way["amenity"~"hospital|shelter|pharmacy|police|fire_station"](around:10000,${lat},${lon});
      relation["amenity"~"hospital|shelter|pharmacy|police|fire_station"](around:10000,${lat},${lon});
    );
    out center;
  `;
  let osmData: { elements: any[] } = { elements: [] };
  try {
    const resp = await axios.post(overpassUrl, query, { headers: { 'Content-Type': 'text/plain' } });
    osmData = resp.data as { elements: any[] };
  } catch (err: any) {
    logger.error({
      event: 'osm_query_failed',
      error: err.message,
      response: err.response ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)) : undefined,
      status: err.response?.status,
      request: err.request ? (err.request.path || err.request) : undefined
    });
    return { error: 'Failed to query OSM' };
  }
  const vagueNames = ['shelter', 'pharmacy', 'hospital', 'police', 'fire_station'];
  let resources = (osmData.elements || []).map((el: any) => {
    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;
    const name = el.tags?.name || el.tags?.amenity || 'Unknown';
    const type = el.tags?.amenity || 'unknown';
    return lat && lon ? {
      disaster_id: id,
      name,
      type,
      location: `SRID=4326;POINT(${lon} ${lat})`,
      location_name: name,
      _dedup_key: name.toLowerCase().trim(),
      _type: type
    } : null;
  }).filter((r: any) => r);
  const seen = new Set();
  resources = resources.filter((r: any) => {
    if (seen.has(r._dedup_key)) return false;
    seen.add(r._dedup_key);
    return true;
  });
  resources = resources.filter((r: any) => !vagueNames.includes(r.name.toLowerCase().trim()));
  const typeCounts: Record<string, number> = {};
  resources = resources.filter((r: any) => {
    typeCounts[r._type] = (typeCounts[r._type] || 0) + 1;
    return typeCounts[r._type] <= 10;
  });
  resources.forEach((r: any) => { delete r._dedup_key; delete r._type; });
  if (!resources.length) {
    return { message: 'No resources found in area.' };
  }
  const { data: inserted, error: insertError } = await supabase.from('resources').insert(resources).select();
  if (insertError) {
    logger.error({ event: 'resource_bulk_insert_error', error: insertError.message });
    return { error: insertError.message };
  }
  logger.info({ event: 'resources_auto_populated', disaster_id: id, count: inserted.length });
  getIO().emit('resources_updated', { disaster_id: id });
  // Invalidate all resource caches for this disaster (any lat/lon)
  await supabase.from('cache').delete().like('key', `resources:${id}:%`);
  return { inserted };
}

// POST /resources/:id/auto-populate (admin only)
export const autoPopulateResources = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await autoPopulateResourcesForDisasterId(id);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    if (result.message) {
      return res.status(200).json({ message: result.message });
    }
    return res.status(201).json({ inserted: result.inserted });
  } catch (err: any) {
    logger.error({ event: 'auto_populate_resources_exception', id, error: err.message });
    return res.status(500).json({ error: 'Resource auto-population failed' });
  }
};
