import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/auth/getSession';

// BFF proxy: component remote (booking-admin) gọi URL tương đối này khi chạy TRONG
// page của resto, nên cookie HttpOnly của Keycloak tự động đi kèm request — không cần
// truyền token qua props. Route này verify session ở đây rồi mới gọi backend thật,
// token backend thật không bao giờ lộ ra trình duyệt.
const BACKEND_URL = process.env.BOOKING_BACKEND_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { date, partySize } = req.query;

  if (!BACKEND_URL) {
    // Chưa nối backend thật — trả mock để demo vẫn chạy được.
    res.status(200).json({
      reservations: [
        { id: 'r1', tableId: 'T-01', customerName: 'Nguyen Van A', date, partySize: Number(partySize) || 2, status: 'confirmed' },
        { id: 'r2', tableId: 'T-04', customerName: 'Tran Thi B', date, partySize: 4, status: 'pending' },
      ],
    });
    return;
  }

  // TODO: gắn credential thật gọi sang backend (service token / mTLS / v.v.)
  const backendRes = await fetch(
    `${BACKEND_URL}/booking/reservations?tenantId=${session.tenantId}&date=${date}&partySize=${partySize}`,
    { headers: { Authorization: `Bearer ${process.env.BOOKING_SERVICE_TOKEN}` } }
  );
  const data = await backendRes.json();
  res.status(backendRes.status).json(data);
}
