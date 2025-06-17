import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import logger from '../utils/logger';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// POST /disasters/:id/verify-image
export const verifyImage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { image_url } = req.body;
  if (!image_url) {
    logger.warn({ event: 'image_verification_missing_url', disaster_id: id, body: req.body });
    return res.status(400).json({ error: 'Missing image_url in request body' });
  }
  const cacheKey = `image_verification:${id}:${image_url}`;
  // 1. Check Supabase cache
  const { data: cacheData } = await supabase
    .from('cache')
    .select('value, expires_at')
    .eq('key', cacheKey)
    .single();
  const now = new Date();
  if (cacheData && new Date(cacheData.expires_at) > now) {
    logger.info({ event: 'image_verification_cache_hit', disaster_id: id, image_url });
    return res.json({ ...cacheData.value, cached: true });
  }
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('Missing Google API key');
    const ai = new GoogleGenAI({ apiKey });

    // Download image and convert to base64
    const response = await axios.get(image_url, { responseType: 'arraybuffer' });
    const base64ImageData = Buffer.from(response.data as ArrayBuffer).toString('base64');

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg', // or detect from image_url
            data: base64ImageData
          }
        },
        { text: 'Analyze this image for disaster authenticity and manipulation. Respond with a short summary and confidence level.' }
      ]
    });

    logger.info({ event: 'gemini_image_verification_response', disaster_id: id, image_url, gemini_raw: result });
    const summary = result.text || null;
    const resultObj = { image_url, gemini_response: result, summary };

    // 3. Store in cache
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: resultObj,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString()
    });
    logger.info({ event: 'image_verification_success', disaster_id: id, image_url });
    res.json(resultObj);
  } catch (err: any) {
    logger.error({ event: 'image_verification_error', disaster_id: id, image_url, error: err.message });
    res.status(500).json({ error: 'Image verification failed', image_url });
  }
};
