import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { getIO } from '../utils/socket';
import { AuthRequest } from '../middleware/auth';
import { uploadImageToGCS } from '../utils/gcs';
import { autoPopulateResourcesForDisasterId } from './resourceController';
import nodemailer from 'nodemailer';

// Helper to get current ISO timestamp
const now = () => new Date().toISOString();


// Helper: send email to all admins (HTML, with review page link)
async function notifyAdminsOfPendingDisaster(disaster: any) {
  // Fetch admin emails from the users table
  const { data: admins, error } = await supabase
    .from('users')
    .select('email')
    .eq('role', 'admin');
  if (error || !admins || admins.length === 0) return;
  const adminEmails = admins.map((a: any) => a.email).filter(Boolean);
  if (adminEmails.length === 0) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const reviewUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/review`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@drc.com',
    to: adminEmails,
    subject: 'Disaster Pending Approval',
    html: `
      <p>A new disaster was submitted and requires review:</p>
      <ul>
        <li><strong>Title:</strong> ${disaster.title}</li>
        <li><strong>ID:</strong> ${disaster.id}</li>
      </ul>
      <p>
        <a href="${reviewUrl}" style="padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:5px;">Review Pending Disasters</a>
      </p>
      <p>This link will take you to the admin review page where you can approve or reject pending disasters.</p>
    `
  });
}

export const createDisaster = async (req: Request, res: Response) => {
  const { title, location_name, location, description, tags, owner_id } = req.body;
  const user = (req as AuthRequest).user;
  if (!title || !location_name || !description || !tags || !owner_id) {
    logger.warn({ event: 'disaster_create_missing_fields', body: req.body });
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  let imageUrls: string[] = [];
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files as Express.Multer.File[]) {
      const url = await uploadImageToGCS(file);
      imageUrls.push(url);
    }
  }
  // Set status: contributors = 'pending', admins = 'approved'
  const status = user?.role === 'admin' ? 'approved' : 'pending';
  const disaster = {
    id: uuidv4(),
    title,
    location_name,
    location,
    description,
    tags,
    owner_id,
    images: imageUrls,
    created_at: now(),
    status,
    audit_trail: [{ action: 'create', user_id: owner_id, timestamp: now() }],
  };
  const { data, error } = await supabase.from('disasters').insert([disaster]).select().single();
  if (error) {
    logger.error({ event: 'disaster_create_error', error: error.message, disaster });
    return res.status(500).json({ error: error.message });
  }
  logger.info({ event: 'disaster_created', id: disaster.id, title });
  getIO().emit('disaster_updated', { action: 'create', disaster: data });
  if (status === 'pending') {
    await notifyAdminsOfPendingDisaster(disaster);
  } else {
    autoPopulateResourcesForDisasterId(disaster.id).catch(err => {
      logger.error({ event: 'auto_populate_background_error', id: disaster.id, error: err instanceof Error ? err.message : String(err) });
    });
  }
  res.status(201).json(data);
};

export const getDisasters = async (req: Request, res: Response) => {
  const { tag } = req.query;
  // Only return approved disasters
  let query = supabase.from('disasters_geojson').select('*').eq('status', 'approved').order('created_at', { ascending: false });
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
  // Fetch all fields from the disasters_geojson view
  const { data, error } = await supabase
    .from('disasters_geojson')
    .select('*')
    .eq('id', id)
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
  let imageUrls = current.images || [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    imageUrls = [];
    for (const file of req.files as Express.Multer.File[]) {
      const url = await uploadImageToGCS(file);
      imageUrls.push(url);
    }
  }
  const updated = {
    ...current,
    title: title ?? current.title,
    location_name: location_name ?? current.location_name,
    location: location ?? current.location,
    description: description ?? current.description,
    tags: tags ?? current.tags,
    images: imageUrls,
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

// Admin: approve a pending disaster
export const approveDisaster = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data: disaster, error } = await supabase.from('disasters').select('*').eq('id', id).single();
  if (error || !disaster) return res.status(404).json({ error: 'Disaster not found' });
  if (disaster.status === 'approved') return res.status(400).json({ error: 'Already approved' });
  const { data: updated, error: updateError } = await supabase.from('disasters').update({ status: 'approved' }).eq('id', id).select().single();
  if (updateError) return res.status(500).json({ error: updateError.message });
  autoPopulateResourcesForDisasterId(id).catch(() => {});
  getIO().emit('disaster_updated', { action: 'approve', disaster: updated });
  res.json({ message: 'Disaster approved', disaster: updated });
};

// Admin: reject a pending disaster
export const rejectDisaster = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data: disaster, error } = await supabase.from('disasters').select('*').eq('id', id).single();
  if (error || !disaster) return res.status(404).json({ error: 'Disaster not found' });
  if (disaster.status === 'approved') return res.status(400).json({ error: 'Cannot reject an approved disaster' });
  const { data: deleted, error: delError } = await supabase.from('disasters').delete().eq('id', id).select().single();
  if (delError) return res.status(500).json({ error: delError.message });
  getIO().emit('disaster_updated', { action: 'reject', disaster: deleted });
  res.json({ message: 'Disaster rejected and removed', id });
};

// Admin: fetch pending disasters for review
export const getPendingDisasters = async (req: Request, res: Response) => {
  // Only allow admins
  const user = (req as AuthRequest).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Query disasters with status 'pending'
  const { data, error } = await supabase
    .from('disasters')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) {
    logger.error({ event: 'disaster_get_pending_error', error: error.message });
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
};
