import type { NextApiRequest } from 'next';

export interface Session {
  userId: string;
  tenantId: string;
  roles: string[];
}

// TODO: thay bằng verify session Keycloak thật, ví dụ:
// - Dùng next-auth: `const session = await getServerSession(req, res, authOptions)`
// - Hoặc tự đọc cookie session (tên cookie tuỳ config), verify JWT bằng public key
//   của Keycloak realm (JWKS endpoint), rồi map claims -> Session.
//
// Đây chỉ là placeholder để các API route dưới `pages/api/booking/*` có chỗ verify
// trước khi proxy sang backend thật — không tự bịa ra 1 cơ chế auth khác.
export async function getSession(req: NextApiRequest): Promise<Session | null> {
  const sessionCookie = req.cookies['resto_session'];
  if (!sessionCookie) return null;

  return {
    userId: 'demo-user',
    tenantId: 'tenant-demo-01',
    roles: ['staff'],
  };
}
