import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = '7d';

// POST /auth/register
export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const { data: existing } = await supabase.from('users').select('*').or(`username.eq.${username},email.eq.${email}`).single();
  if (existing) {
    return res.status(409).json({ error: 'Username or email already exists' });
  }
  const password_hash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    username,
    email,
    password_hash,
    role: 'contributor',
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from('users').insert([user]);
  if (error) {
    logger.error({ event: 'register_error', error: error.message });
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json({ message: 'User registered' });
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  const { data: user } = await supabase.from('users').select('*').eq('username', username).single();
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
};
