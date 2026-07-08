import { createBackendProxy } from '../../../lib/services/createBackendProxy';

export default createBackendProxy({
  backendPath: '/booking/reservations',
  backendUrlEnv: 'BOOKING_BACKEND_URL',
  serviceTokenEnv: 'BOOKING_SERVICE_TOKEN',
  // Chưa nối backend thật — trả mock để demo vẫn chạy được.
  mockResponse: (req) => ({
    reservations: [
      { id: 'r1', tableId: 'T-01', customerName: 'Nguyen Van A', date: req.query.date, partySize: Number(req.query.partySize) || 2, status: 'confirmed' },
      { id: 'r2', tableId: 'T-04', customerName: 'Tran Thi B', date: req.query.date, partySize: 4, status: 'pending' },
    ],
  }),
});
