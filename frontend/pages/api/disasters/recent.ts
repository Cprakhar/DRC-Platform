import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
  // Forward all query params
  const query = req.url?.split('?')[1] || '';
  const url = `${backendUrl}/disasters/recent${query ? `?${query}` : ''}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }
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
