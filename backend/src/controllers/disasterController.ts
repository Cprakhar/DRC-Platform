import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { getIO } from '../utils/socket';
import { AuthRequest } from '../middleware/auth';

// Helper to get current ISO timestamp
const now = () => new Date().toISOString();

export const createDisaster = async (req: Request, res: Response) => {
  const { title, location_name, location, description, tags, owner_id } = req.body;
  if (!title || !location_name || !description || !tags || !owner_id) {
    logger.warn({ event: 'disaster_create_missing_fields', body: req.body });
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const disaster = {
    id: uuidv4(),
    title,
    location_name,
    location,
    description,
    tags,
    owner_id,
    created_at: now(),
    audit_trail: [{ action: 'create', user_id: owner_id, timestamp: now() }],
  };
  const { data, error } = await supabase.from('disasters').insert([disaster]).select().single();
  if (error) {
    logger.error({ event: 'disaster_create_error', error: error.message, disaster });
    return res.status(500).json({ error: error.message });
  }
  logger.info({ event: 'disaster_created', id: disaster.id, title });
  getIO().emit('disaster_updated', { action: 'create', disaster: data });
  res.status(201).json(data);
};

export const getDisasters = async (req: Request, res: Response) => {
  const { tag } = req.query;
  let query = supabase.from('disasters').select('*').order('created_at', { ascending: false });
  if (tag) {
    query = query.contains('tags', [tag]);
  }
  const { data, error } = await query;
  if (error) {
    logger.error({ event: 'disaster_get_error', error: error.message, tag });
    return res.status(500).json({ error: error.message });
  }
  logger.info({ event: 'disaster_listed', count: data?.length, tag });
  res.json(data);
};

export const getDisasterById = async (req: Request, res: Response) => {
  const { id } = req.params;
  // Fetch all fields and WKT for location
  const { data, error } = await supabase
    .rpc('get_disaster_with_wkt', { disaster_id: id })
    .single();
  if (error || !data) {
    logger.warn({ event: 'disaster_get_by_id_not_found', id, error: error?.message });
    return res.status(404).json({ error: 'Disaster not found' });
  }
  res.json(data);
};

export const updateDisaster = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;
  const { title, location_name, location, description, tags, owner_id } = req.body;
  // Fetch current disaster
  const { data: current, error: fetchError } = await supabase.from('disasters').select('*').eq('id', id).single();
  if (fetchError || !current) {
    logger.warn({ event: 'disaster_update_not_found', id });
    return res.status(404).json({ error: 'Not found' });
  }
  // Only owner can update
  if (!authReq.user || authReq.user.id !== current.owner_id) {
    logger.warn({ event: 'disaster_update_forbidden', id, user: authReq.user?.id });
    return res.status(403).json({ error: 'Only the owner can update this disaster' });
  }
  const updated = {
    ...current,
    title: title ?? current.title,
    location_name: location_name ?? current.location_name,
    location: location ?? current.location,
    description: description ?? current.description,
    tags: tags ?? current.tags,
    audit_trail: [
      ...(current.audit_trail || []),
      { action: 'update', user_id: owner_id || current.owner_id, timestamp: now() },
    ],
  };
  const { data, error } = await supabase.from('disasters').update(updated).eq('id', id).select().single();
  if (error) {
    logger.error({ event: 'disaster_update_error', error: error.message, id });
    return res.status(500).json({ error: error.message });
  }
  logger.info({ event: 'disaster_updated', id });
  getIO().emit('disaster_updated', { action: 'update', disaster: data });
  res.json(data);
};

export const deleteDisaster = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('disasters').delete().eq('id', id).select().single();
  if (error) {
    logger.error({ event: 'disaster_delete_error', error: error.message, id });
    return res.status(404).json({ error: error.message });
  }
  logger.info({ event: 'disaster_deleted', id });
  getIO().emit('disaster_updated', { action: 'delete', disaster: data });
  res.json({ message: 'Deleted', id: data.id });
};
