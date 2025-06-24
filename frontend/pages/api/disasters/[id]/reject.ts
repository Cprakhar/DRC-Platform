import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  const url = `${BACKEND_URL}/disasters/${id}/reject`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }
  // Forward cookies for session auth if needed
  if (req.headers.cookie) {
    headers['Cookie'] = req.headers.cookie;
  }

  const backendRes = await fetch(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  const data = await backendRes.text();
  res.status(backendRes.status);
  try {
    res.json(JSON.parse(data));
  } catch {
    res.send(data);
  }
}
