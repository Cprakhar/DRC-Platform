import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  // Forward all query params
  const query = req.url?.split('?')[1] || '';
  const url = `${BACKEND_URL}/disasters/recent${query ? `?${query}` : ''}`;

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
