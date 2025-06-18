import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import logger from '../utils/logger';
import { getIO } from '../utils/socket';

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
  const cacheKey = `resources:${id}:${lat}:${lon}`;
  // 1. Check Supabase cache
  const { data: cacheData } = await supabase
    .from('cache')
    .select('value, expires_at')
    .eq('key', cacheKey)
    .single();
  const now = new Date();
  if (cacheData && new Date(cacheData.expires_at) > now) {
    logger.info({ event: 'resource_cache_hit', disaster_id: id, lat, lon });
    return res.json({ resources: cacheData.value.resources, cached: true });
  }
  // 2. Geospatial query for resources
  try {
    const { data, error } = await supabase.rpc('get_nearby_resources', {
      disaster_id: id,
      lat: parseFloat(lat as string),
      lon: parseFloat(lon as string),
      radius: RESOURCE_RADIUS_METERS
    });
    if (error) {
      logger.error({ event: 'resource_query_error', error: error.message, disaster_id: id });
      return res.status(500).json({ error: error.message });
    }
    // 3. Store in cache
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: { resources: data },
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString()
    });
    logger.info({ event: 'resource_query_success', disaster_id: id, count: data.length });
    getIO().emit('resources_updated', { disaster_id: id, resources: data });
    res.json({ resources: data });
  } catch (err: any) {
    logger.error({ event: 'resource_query_exception', disaster_id: id, error: err.message });
    res.status(500).json({ error: 'Resource lookup failed' });
  }
};
