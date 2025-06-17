import { AtpAgent } from '@atproto/api';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import { supabase } from '../utils/supabaseClient';
import logger from '../utils/logger';

dotenv.config();

const BLUESKY_IDENTIFIER = process.env.BLUESKY_IDENTIFIER;
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD;

const mockSocialMediaPosts = [
  { post: '#floodrelief Need food and clean water in Lower East Side, Manhattan', user: 'citizen1', timestamp: '2025-06-17T10:00:00Z' },
  { post: 'Urgent: water level rising near Queens Blvd! #floodSOS', user: 'netrunnerX', timestamp: '2025-06-17T10:05:00Z' },
  { post: 'Red Cross shelter operational in Brooklyn Heights. Walk-ins welcome. #relief', user: 'reliefAdmin', timestamp: '2025-06-17T10:10:00Z' },
  { post: 'Anyone near SoHo with medical experience? Elderly trapped. #flood #urgent', user: 'localMedic', timestamp: '2025-06-17T10:12:00Z' },
  { post: 'We\'re handing out blankets and hot meals on 5th Ave & 20th St. #floodrelief', user: 'mealTeam6', timestamp: '2025-06-17T10:15:00Z' },
  { post: 'Signal weak in Bronx. No power since last night. Need update on rescue.', user: 'bronxVoices', timestamp: '2025-06-17T10:18:00Z' },
  { post: 'Boat team heading to Canal St. Ping us if stranded in that zone. #rescueOps', user: 'floodFleetOps', timestamp: '2025-06-17T10:22:00Z' },
  { post: 'We need diapers, formula at Harlem shelter ASAP. #helpneeded', user: 'harlemRelief', timestamp: '2025-06-17T10:25:00Z' },
  { post: 'Just saw debris floating across Madison Ave. Don\'t drive. #floodupdate', user: 'trafficWatchNY', timestamp: '2025-06-17T10:27:00Z' },
  { post: 'Trapped with 3 kids at 88th & York. Floor 2. No cell signal. Please assist! #floodSOS', user: 'momInDistress', timestamp: '2025-06-17T10:32:00Z' },
  { post: 'Downtown hospital generator failed. Evacuating critical patients. #urgent', user: 'nyEmergencyCoord', timestamp: '2025-06-17T10:35:00Z' },
  { post: 'Dogs and cats left behind in East Village! Volunteers needed. #animalrescue', user: 'petrescueNYC', timestamp: '2025-06-17T10:40:00Z' },
  { post: 'Food truck open at Times Sq giving free hot meals. #floodrelief', user: 'streetAid', timestamp: '2025-06-17T10:45:00Z' },
  { post: 'We need more blankets at Staten Island center. It\'s freezing. #floodrelief', user: 'volunteerHQ', timestamp: '2025-06-17T10:47:00Z' },
  { post: 'Trapped under debris near Battery Park. Sending GPS location. Please hurry.', user: 'geoStranded', timestamp: '2025-06-17T10:50:00Z' },
  { post: 'N95 masks needed at the Midtown shelter due to mold. #postfloodhealth', user: 'medWatch', timestamp: '2025-06-17T10:53:00Z' },
  { post: 'Building collapse in Bushwick reported. Awaiting confirmation. #disaster', user: 'crisisSignal', timestamp: '2025-06-17T10:55:00Z' }
];

const CACHE_TTL_MINUTES = 60;

// GET /disasters/:id/social-media
export const getSocialMedia = async (req: Request, res: Response) => {
  const disasterId = req.params.id;
  const tag = req.query.tag as string | undefined;
  const keyword = tag || disasterId;
  const cacheKey = `social_media:${disasterId}:${keyword}`;

  // 1. Check Supabase cache
  const { data: cacheData, error: cacheError } = await supabase
    .from('cache')
    .select('value, expires_at')
    .eq('key', cacheKey)
    .single();
  const now = new Date();
  if (cacheData && new Date(cacheData.expires_at) > now) {
    logger.info({ event: 'social_media_cache_hit', disasterId, keyword });
    return res.json({ disaster_id: disasterId, posts: cacheData.value.posts, source: cacheData.value.source, cached: true });
  }

  // 2. Try Bluesky API
  if (!BLUESKY_IDENTIFIER || !BLUESKY_PASSWORD) {
    logger.error({ event: 'bluesky_credentials_missing' });
    return res.status(500).json({ error: 'Bluesky credentials not set in .env' });
  }
  const agent = new AtpAgent({ service: 'https://bsky.social' });
  try {
    await agent.login({ identifier: BLUESKY_IDENTIFIER, password: BLUESKY_PASSWORD });
    const timeline = await agent.getTimeline({ limit: 10 });
    const posts = (timeline.data.feed || [])
      .filter((item: any) => item.post?.record?.text?.toLowerCase().includes(keyword.toLowerCase()))
      .map((item: any) => ({
        post: item.post.record.text,
        user: item.post.author.handle,
        timestamp: item.post.record.createdAt
      }));
    let result;
    if (!posts.length) {
      logger.info({ event: 'social_media_no_bluesky_posts', disasterId, keyword });
      result = { disaster_id: disasterId, posts: mockSocialMediaPosts, source: 'mock' };
    } else {
      logger.info({ event: 'social_media_bluesky_posts', disasterId, keyword, count: posts.length });
      result = { disaster_id: disasterId, posts, source: 'bluesky' };
    }
    // 3. Store in cache
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: result,
      expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString()
    });
    logger.info({ event: 'social_media_cache_set', disasterId, keyword });
    return res.json(result);
  } catch (err: any) {
    logger.error({ event: 'social_media_bluesky_error', disasterId, keyword, error: err.message });
    // 4. On error, fallback to cache or mock
    if (cacheData && cacheData.value) {
      logger.info({ event: 'social_media_cache_fallback', disasterId, keyword });
      return res.json({ disaster_id: disasterId, posts: cacheData.value.posts, source: cacheData.value.source, cached: true });
    }
    logger.info({ event: 'social_media_mock_fallback', disasterId, keyword });
    return res.json({ disaster_id: disasterId, posts: mockSocialMediaPosts, source: 'mock' });
  }
};
