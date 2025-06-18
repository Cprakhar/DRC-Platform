import axios from 'axios';
import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import logger from '../utils/logger';
import { getIO } from '../utils/socket';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_RADIUS_METERS = 10000; // 10km
const DEFAULT_TYPE = 'hospital';

// Helper to build Overpass QL query
function buildOverpassQuery(lat: number, lon: number, type: string, radius: number) {
  return `
    [out:json][timeout:25];
    (
      node["amenity"="${type}"](around:${radius},${lat},${lon});
      way["amenity"="${type}"](around:${radius},${lat},${lon});
      relation["amenity"="${type}"](around:${radius},${lat},${lon});
    );
    out center tags;
  `;
}

// GET /disasters/:id/external-resources?lat=...&lon=...&type=hospital
export const getExternalResources = async (req: Request, res: Response) => {
  const { id } = req.params;
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const type = (req.query.type as string) || DEFAULT_TYPE;
  const radius = req.query.radius ? parseInt(req.query.radius as string) : DEFAULT_RADIUS_METERS;

  if (isNaN(lat) || isNaN(lon)) {
    logger.warn({ event: 'external_resource_missing_coords', query: req.query });
    return res.status(400).json({ error: 'Missing or invalid lat/lon query parameters' });
  }

  const cacheKey = `external_resources:${id}:${lat}:${lon}:${type}:${radius}`;
  // 1. Check Supabase cache
  const { data: cacheData } = await supabase
    .from('cache')
    .select('value, expires_at')
    .eq('key', cacheKey)
    .single();
  const now = new Date();
  if (cacheData && new Date(cacheData.expires_at) > now) {
    logger.info({ event: 'external_resource_cache_hit', disaster_id: id, lat, lon, type });
    return res.json({ resources: cacheData.value.resources, cached: true });
  }

  // 2. Query Overpass API
  try {
    const query = buildOverpassQuery(lat, lon, type, radius);
    const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 'Content-Type': 'text/plain' }
    });
    // Fix type error by asserting response.data as expected Overpass API response type
    const data = response.data as { elements: any[] };
    const elements = data.elements || [];
    let resources = elements.map((el: any) => ({
      id: el.id,
      name: el.tags?.name || null,
      type: el.tags?.amenity || type,
      address: el.tags?.address || null,
      lat: el.lat || el.center?.lat,
      lon: el.lon || el.center?.lon
    }));
    resources = resources.slice(0, 20);
    // 3. Store in cache
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: { resources },
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString()
    });
    logger.info({ event: 'external_resource_query_success', disaster_id: id, type, count: resources.length });
    getIO().emit('external_resources_updated', { disaster_id: id, resources });
    res.json({ resources });
  } catch (err: any) {
    logger.error({ event: 'external_resource_query_error', disaster_id: id, error: err.message });
    res.status(500).json({ error: 'External resource lookup failed' });
  }
};
