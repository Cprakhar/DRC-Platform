import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization as string;
  }
  if (req.headers.cookie) {
    headers['cookie'] = req.headers.cookie as string;
  }

  const backendRes = await fetch(`http://localhost:4000/disasters/${id}/approve`, {
    method: req.method,
    headers,
  });
  const data = await backendRes.json();
  res.status(backendRes.status).json(data);
}
