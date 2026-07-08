import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/auth/getSession';

const BACKEND_URL = process.env.BOOKING_BACKEND_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!BACKEND_URL) {
    res.status(200).json({
      tables: [
        { id: 'T-01', name: 'Bàn 1', capacity: 2, status: 'occupied' },
        { id: 'T-02', name: 'Bàn 2', capacity: 4, status: 'available' },
        { id: 'T-04', name: 'Bàn 4', capacity: 6, status: 'reserved' },
      ],
    });
    return;
  }

  // TODO: gắn credential thật gọi sang backend (service token / mTLS / v.v.)
  const backendRes = await fetch(`${BACKEND_URL}/booking/tables?tenantId=${session.tenantId}`, {
    headers: { Authorization: `Bearer ${process.env.BOOKING_SERVICE_TOKEN}` },
  });
  const data = await backendRes.json();
  res.status(backendRes.status).json(data);
}
