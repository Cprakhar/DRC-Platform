import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

// POST /disasters/:id/reports
export const createReport = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { id: disaster_id } = req.params;
  const { content, image_url } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Missing content' });
  }
  const report = {
    id: uuidv4(),
    disaster_id,
    user_id: authReq.user?.id,
    content,
    image_url,
    verification_status: 'pending',
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from('reports').insert([report]);
  if (error) {
    logger.error({ event: 'report_create_error', error: error.message });
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(report);
};

// PUT /disasters/:id/reports/:rid
export const updateReport = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { id: disaster_id, rid } = req.params;
  const { content, image_url, verification_status } = req.body;
  // Fetch current report
  const { data: current, error: fetchError } = await supabase.from('reports').select('*').eq('id', rid).single();
  if (fetchError || !current) {
    return res.status(404).json({ error: 'Report not found' });
  }
  // Only owner can update
  if (!authReq.user || authReq.user.id !== current.user_id) {
    return res.status(403).json({ error: 'Only the report owner can update this report' });
  }
  const updated = {
    ...current,
    content: content ?? current.content,
    image_url: image_url ?? current.image_url,
    verification_status: verification_status ?? current.verification_status
  };
  const { error } = await supabase.from('reports').update(updated).eq('id', rid);
  if (error) {
    logger.error({ event: 'report_update_error', error: error.message });
    return res.status(500).json({ error: error.message });
  }
  res.json(updated);
};

// DELETE /disasters/:id/reports/:rid
export const deleteReport = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { rid } = req.params;
  // Fetch current report
  const { data: current, error: fetchError } = await supabase.from('reports').select('*').eq('id', rid).single();
  if (fetchError || !current) {
    return res.status(404).json({ error: 'Report not found' });
  }
  // Only owner can delete
  if (!authReq.user || authReq.user.id !== current.user_id) {
    return res.status(403).json({ error: 'Only the report owner can delete this report' });
  }
  const { error } = await supabase.from('reports').delete().eq('id', rid);
  if (error) {
    logger.error({ event: 'report_delete_error', error: error.message });
    return res.status(500).json({ error: error.message });
  }
  res.json({ message: 'Deleted', id: rid });
};
