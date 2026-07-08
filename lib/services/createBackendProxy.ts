import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../auth/getSession';

interface ProxyOptions {
  /** Path trên backend thật, vd '/booking/reservations'. */
  backendPath: string;
  /** Tên env var chứa base URL backend thật (khớp `backend.baseUrlEnv` trong services.config.js). */
  backendUrlEnv: string;
  /** Tên env var chứa service token gọi backend (khớp `backend.serviceTokenEnv`). */
  serviceTokenEnv: string;
  /** Query string forward sang backend — mặc định forward nguyên req.query + tenantId từ session. */
  buildQuery?: (req: NextApiRequest, tenantId: string) => Record<string, string>;
  /** Response mock khi backend chưa cấu hình (demo/dev) — bỏ qua thì trả 503. */
  mockResponse?: (req: NextApiRequest) => unknown;
}

/**
 * Factory cho BFF proxy route: verify session Keycloak (cookie HttpOnly tự động đi kèm
 * vì component remote gọi fetch() bằng URL tương đối tới chính domain resto), rồi mới
 * forward sang backend thật kèm service token — token thật không bao giờ lộ ra trình duyệt.
 *
 * Dùng cho MỌI service trong services.config.js, xem pages/api/booking/*.ts làm mẫu.
 */
export function createBackendProxy(options: ProxyOptions) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession(req);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const backendUrl = process.env[options.backendUrlEnv];
    if (!backendUrl) {
      if (options.mockResponse) {
        res.status(200).json(options.mockResponse(req));
        return;
      }
      res.status(503).json({ error: `${options.backendUrlEnv} chưa được cấu hình` });
      return;
    }

    const queryObj = options.buildQuery
      ? options.buildQuery(req, session.tenantId)
      : { ...(req.query as Record<string, string>), tenantId: session.tenantId };
    const params = new URLSearchParams(queryObj);

    const backendRes = await fetch(`${backendUrl}${options.backendPath}?${params}`, {
      headers: { Authorization: `Bearer ${process.env[options.serviceTokenEnv]}` },
    });
    const data = await backendRes.json();
    res.status(backendRes.status).json(data);
  };
}
