import axios from 'axios';
import * as cheerio from 'cheerio';
import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import logger from '../utils/logger';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Helper to scrape FEMA updates (new structure, paginated)
async function fetchFemaUpdates(pages = 2) {
  const baseUrl = 'https://www.fema.gov/about/news-multimedia/press-releases';
  let updates: any[] = [];
  for (let page = 0; page < pages; page++) {
    const url = page === 0 ? baseUrl : `${baseUrl}?page=${page}`;
    const res = await axios.get(url);
    const $ = cheerio.load(res.data as string);
    $('.views-listing.views-row').each((_, el) => {
      const title = $(el).find('.views-field-title .list-view-title a').text().trim();
      let link = $(el).find('.views-field-title .list-view-title a').attr('href');
      if (link && link.startsWith('/')) link = 'https://www.fema.gov' + link;
      const description = $(el).find('.views-field-body .field-content').text().trim();
      const date = $(el).find('.views-field-nothing time.datetime').text().trim();
      if (title && link) updates.push({ title, link, description, date });
    });
  }
  return updates;
}

// Helper to fetch FEMA updates using disaster metadata
async function fetchFemaUpdatesForDisaster(disaster: any) {
  const keywords = [...(disaster.tags || []), disaster.location_name, disaster.title].filter(Boolean);
  const searchQuery = encodeURIComponent(keywords.join(' '));
  const url = `https://www.fema.gov/press-release/search?keywords=${searchQuery}`;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data as string);
    const updates: any[] = [];
    $('.views-listing.views-row').each((_, el) => {
      const title = $(el).find('.views-field-title .list-view-title a').text().trim();
      let link = $(el).find('.views-field-title .list-view-title a').attr('href');
      if (link && link.startsWith('/')) link = 'https://www.fema.gov' + link;
      const description = $(el).find('.views-field-body .field-content').text().trim();
      const date = $(el).find('.views-field-nothing time.datetime').text().trim();
      if (title && link) updates.push({ title, link, description, date });
    });
    return updates.slice(0, 5); // return first 5 relevant results
  } catch (err: any) {
    logger.error({ event: 'fema_update_fetch_failed', error: err.message });
    return [];
  }
}

// GET /disasters/:id/official-updates
export const getOfficialUpdates = async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `official_updates:${id}`;
  // 1. Check Supabase cache
  const { data: cacheData } = await supabase
    .from('cache')
    .select('value, expires_at')
    .eq('key', cacheKey)
    .single();
  const now = new Date();
  if (cacheData && new Date(cacheData.expires_at) > now) {
    logger.info({ event: 'official_updates_cache_hit', disaster_id: id });
    return res.json({ updates: cacheData.value.updates, cached: true });
  }
  // 2. Fetch disaster metadata
  const { data: disaster, error: disasterError } = await supabase.from('disasters').select('*').eq('id', id).single();
  if (disasterError || !disaster) {
    logger.error({ event: 'official_updates_disaster_not_found', disaster_id: id });
    return res.status(404).json({ error: 'Disaster not found' });
  }
  // 3. Scrape FEMA updates using disaster context
  try {
    const fema = await fetchFemaUpdatesForDisaster(disaster);
    const updates = [
      { source: 'FEMA', items: fema }
    ];
    // 4. Store in cache
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: { updates },
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString()
    });
    logger.info({ event: 'official_updates_scraped', disaster_id: id, fema_count: fema.length });
    res.json({ updates });
  } catch (err: any) {
    logger.error({ event: 'official_updates_error', disaster_id: id, error: err.message });
    res.status(500).json({ error: 'Failed to fetch official updates' });
  }
};
