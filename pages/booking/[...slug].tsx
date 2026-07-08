import React from 'react';
import RemoteModuleRouter from '../../components/RemoteModuleRouter';

// Mỗi remote module cần 1 dynamic import riêng, key phải khớp `modules[].key` của
// service 'bookingAdmin' trong services.config.js — webpack/MF cần specifier dạng
// literal để resolve đúng container, không thể generate động từ config.
const remoteMap = {
  reservations: React.lazy(() => import('bookingAdmin/ReservationsPage')),
  tables: React.lazy(() => import('bookingAdmin/TablesPage')),
};

export default function BookingRoute() {
  // tenantId trong thực tế lấy từ session/subdomain của resto,
  // truyền xuống remote component như 1 prop bình thường.
  return <RemoteModuleRouter remoteMap={remoteMap} tenantId="tenant-demo-01" notFoundLabel="Không tìm thấy trang booking phù hợp" />;
}
