import * as cheerio from 'cheerio';
import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { getIO } from '../utils/socket';

// Helper to fetch and parse GDACS news
async function fetchGDACSUpdates() {
  let updates: any[] = [];
  let baseUrl = 'https://gdacs.org/Knowledge/archivenews.aspx';
  const response = await fetch(baseUrl);
  const html = await response.text();
  const $ = cheerio.load(html);
  $('table#ctl00_CPH_grNews tr').each((i, row) => {
    const cols = $(row).find('td');
    if (cols.length === 2) {
      const link = $(cols[0]).find('a').attr('href');
      const fullLink = link ? `https://gdacs.org/Knowledge/${link}` : null;
      const title = $(cols[1]).find('b span').text().trim();
      const pubdate = $(cols[1]).find('i span[id$="Label2"]').text().trim();
      const description = $(cols[1]).find('span[id$="ldescription"]').text().trim();
      const formdate = $(cols[1]).find('span[id$="lformdate"]').text().trim();
      const todate = $(cols[1]).find('span[id$="ltodate"]').text().trim();
      if (title && pubdate) {
        updates.push({
          title,
          pubdate,
          description,
          formdate,
          todate,
          link: fullLink
        });
      }
    }
  });
  return updates;
}

// GET /disasters/official-updates
export const getOfficialUpdates = async (_req: Request, res: Response) => {
  try {
    const updates = await fetchGDACSUpdates();
    res.json({ updates });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch official updates' });
  }
};

// WebSocket: Periodically emit updates
let lastEmitted: string = '';
setInterval(async () => {
  try {
    const updates = await fetchGDACSUpdates();
    const latest = updates[0]?.title + updates[0]?.pubdate;
    if (latest && latest !== lastEmitted) {
      getIO().emit('official_updates', { updates });
      lastEmitted = latest;
    }
  } catch (e) {
    // Ignore errors
  }
}, 60000); // every 60 seconds
