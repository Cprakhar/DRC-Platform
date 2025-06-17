import axios from 'axios';
import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import logger from '../utils/logger';
import { GoogleGenAI } from "@google/genai";

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>;
}

interface OSMGeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

// Helper to call Gemini API for location extraction using @google/genai
async function extractLocationWithGemini(description: string): Promise<string | null> {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!GEMINI_API_KEY) throw new Error('Missing Gemini API key');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    // Enhanced prompt for Gemini API
    const prompt = `Extract only the location name from the following disaster description. Respond with just the location name, no commentary or extra words.\n\nExample:\nInput: Heavy flooding in Manhattan, NYC\nOutput: Manhattan, NYC\n\nInput: ${description}\nOutput:`;
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt }
      ]
    });
    logger.info({ event: 'gemini_api_response', description, gemini_raw: result });
    const text = result.text;
    if (text && typeof text === 'string') {
      return text.trim();
    }
    return null;
  } catch (err: any) {
    logger.error({ event: 'gemini_api_error', error: err.message });
    return null;
  }
}

// Helper for OSM geocoding with timeout and retry
async function geocodeWithOSM(location: string, maxRetries = 3, timeout = 10000): Promise<OSMGeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get<OSMGeocodeResult[]>(url, {
        headers: { 'User-Agent': 'DRC-Platform/1.0' },
        timeout,
      });
      logger.info({ event: 'osm_api_response', location_name: location, attempt, osm_raw: response.data });
      if (response.data && response.data[0]) return response.data[0];
      return null;
    } catch (err: any) {
      lastError = err;
      logger.warn({ event: 'osm_geocode_retry', location_name: location, attempt, error: err.code || err.message });
      // Only retry on timeout or network errors
      if (err.code !== 'ECONNABORTED' && err.code !== 'ETIMEDOUT' && err.code !== 'ENOTFOUND') break;
      if (attempt === maxRetries) throw err;
    }
  }
  throw lastError;
}

// POST /geocode
export const geocode = async (req: Request, res: Response) => {
  const { description } = req.body;
  if (!description) {
    logger.warn({ event: 'geocode_missing_description', body: req.body });
    return res.status(400).json({ error: 'Missing description' });
  }

  // 1. Use Gemini API to extract location name
  const location_name = await extractLocationWithGemini(description);
  if (!location_name) {
    logger.warn({ event: 'geocode_no_location_found', description });
    return res.status(404).json({ error: 'No location found in description' });
  }

  // 2. Check Supabase cache
  const cacheKey = `geocode:${location_name}`;
  const { data: cacheData } = await supabase
    .from('cache')
    .select('value, expires_at')
    .eq('key', cacheKey)
    .single();
  const now = new Date();
  if (cacheData && new Date(cacheData.expires_at) > now) {
    logger.info({ event: 'geocode_cache_hit', location_name });
    return res.json({ location_name, ...cacheData.value, cached: true });
  }

  // 3. Use OpenStreetMap Nominatim for geocoding
  try {
    let geo = await geocodeWithOSM(location_name);
    // Retry with simplified location if not found
    if (!geo && location_name.includes(',')) {
      const simplified = location_name.split(',')[0];
      logger.warn({ event: 'geocode_retry_simplified', original: location_name, simplified });
      geo = await geocodeWithOSM(simplified);
    }
    if (!geo) {
      logger.warn({ event: 'geocode_no_result', location_name });
      return res.status(404).json({ error: 'Location not found', location_name });
    }
    const result = {
      lat: geo.lat,
      lon: geo.lon,
      display_name: geo.display_name
    };
    // 4. Store in cache
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: result,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
    logger.info({ event: 'geocode_success', location_name, lat: geo.lat, lon: geo.lon });
    res.json({ location_name, ...result });
  } catch (err: any) {
    logger.error({ event: 'geocode_error', location_name, error: err.message, axios: err.toJSON ? err.toJSON() : err });
    res.status(500).json({ error: 'Geocoding failed', location_name });
  }
};
