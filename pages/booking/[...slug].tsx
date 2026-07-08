import React from 'react';
import { useRouter } from 'next/router';

interface RemoteProps {
  tenantId: string;
}

const RemoteMap: Record<string, React.ComponentType<RemoteProps>> = {
  reservations: React.lazy(() => import('bookingAdmin/ReservationsPage')),
  tables: React.lazy(() => import('bookingAdmin/TablesPage')),
};

export default function BookingCatchAll() {
  const router = useRouter();
  const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug;

  if (!slug || !RemoteMap[slug]) {
    return <p>Không tìm thấy trang booking phù hợp: {String(slug)}</p>;
  }

  const RemoteComponent = RemoteMap[slug];

  // tenantId trong thực tế lấy từ session/subdomain của resto,
  // truyền xuống remote component như 1 prop bình thường.
  return <RemoteComponent tenantId="tenant-demo-01" />;
}
