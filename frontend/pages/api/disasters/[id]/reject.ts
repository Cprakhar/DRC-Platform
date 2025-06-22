import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
  const url = `${backendUrl}/disasters/${id}/reject`;

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
