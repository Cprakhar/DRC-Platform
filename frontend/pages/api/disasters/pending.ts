import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization as string;
  }
  if (req.headers.cookie) {
    headers['cookie'] = req.headers.cookie as string;
  }

  const backendRes = await fetch(`${BACKEND_URL}/disasters/pending`, {
    method: req.method,
    headers,
  });
  const data = await backendRes.json();
  res.status(backendRes.status).json(data);
}
