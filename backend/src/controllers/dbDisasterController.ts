import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';

// GET /db-disasters - fetch disasters from Supabase
export const getDbDisasters = async (req: Request, res: Response) => {
  const { tag } = req.query;
  let query = supabase.from('disasters').select('*').order('created_at', { ascending: false });
  if (tag) {
    query = query.contains('tags', [tag]);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
