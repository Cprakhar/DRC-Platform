import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Helper to get current ISO timestamp
const now = () => new Date().toISOString();

export const createDisaster = async (req: Request, res: Response) => {
  const { title, location_name, location, description, tags, owner_id } = req.body;
  if (!title || !location_name || !description || !tags || !owner_id) {
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
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

export const getDisasters = async (req: Request, res: Response) => {
  const { tag } = req.query;
  let query = supabase.from('disasters').select('*').order('created_at', { ascending: false });
  if (tag) {
    query = query.contains('tags', [tag]);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const updateDisaster = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, location_name, location, description, tags, owner_id } = req.body;
  // Fetch current disaster
  const { data: current, error: fetchError } = await supabase.from('disasters').select('*').eq('id', id).single();
  if (fetchError || !current) return res.status(404).json({ error: 'Not found' });
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
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const deleteDisaster = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('disasters').delete().eq('id', id).select().single();
  if (error) return res.status(404).json({ error: error.message });
  res.json({ message: 'Deleted', id: data.id });
};
