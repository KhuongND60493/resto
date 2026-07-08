import { createBackendProxy } from '../../../lib/services/createBackendProxy';

export default createBackendProxy({
  backendPath: '/booking/tables',
  backendUrlEnv: 'BOOKING_BACKEND_URL',
  serviceTokenEnv: 'BOOKING_SERVICE_TOKEN',
  mockResponse: () => ({
    tables: [
      { id: 'T-01', name: 'Bàn 1', capacity: 2, status: 'occupied' },
      { id: 'T-02', name: 'Bàn 2', capacity: 4, status: 'available' },
      { id: 'T-04', name: 'Bàn 4', capacity: 6, status: 'reserved' },
    ],
  }),
});
