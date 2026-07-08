import React, { Suspense } from 'react';
import { useRouter } from 'next/router';

interface RemoteProps {
  tenantId: string;
}

interface Props {
  /**
   * Map key (route segment cuối) -> component đã React.lazy() sẵn. Phải khai literal
   * `import('scope/Module')` ở nơi gọi (page riêng của từng service) — webpack/Module
   * Federation cần specifier dạng literal để resolve container, không thể tạo bằng
   * biến string hay generate động từ services.config.js.
   */
  remoteMap: Record<string, React.ComponentType<RemoteProps>>;
  tenantId: string;
  notFoundLabel?: string;
}

/**
 * Logic route-matching + loading state dùng chung cho MỌI catch-all page của từng
 * service (vd pages/booking/[...slug].tsx). Thêm service mới chỉ cần 1 page mỏng
 * khai remoteMap rồi render component này — không lặp lại logic slug/Suspense.
 */
export default function RemoteModuleRouter({ remoteMap, tenantId, notFoundLabel }: Props) {
  const router = useRouter();
  const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug;

  if (!slug || !remoteMap[slug]) {
    return <p>{notFoundLabel ?? 'Không tìm thấy trang phù hợp'}: {String(slug)}</p>;
  }

  const RemoteComponent = remoteMap[slug];

  return (
    <Suspense fallback={<p>Đang tải...</p>}>
      <RemoteComponent tenantId={tenantId} />
    </Suspense>
  );
}
