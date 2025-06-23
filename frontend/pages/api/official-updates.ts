import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  // Clone headers and remove 'host'
  const { host, ...headersWithoutHost } = req.headers as Record<string, string>;

  // Correct endpoint: use /disasters/official-updates
  const apiRes = await fetch(`${backendUrl}/disasters/official-updates`, {
    method: 'GET',
    headers: headersWithoutHost,
    credentials: 'include',
  });
  const data = await apiRes.json();
  res.status(apiRes.status).json(data);
}
