import RemoteModuleRouter from '../../components/RemoteModuleRouter';
import { loadRemoteComponent } from '../../lib/services/loadRemoteComponent';
import { services } from '../../services.config';

// @module-federation/runtime nhận specifier dạng STRING (không cần literal import() như
// bản Next 13 dùng webpack ModuleFederationPlugin) — nên remoteMap generate được thẳng từ
// services.config.js, không cần liệt kê tay từng module nữa.
const bookingService = services.find((s) => s.key === 'bookingAdmin')!;
const remoteMap = Object.fromEntries(
  bookingService.modules.map((m) => [m.key, loadRemoteComponent(bookingService, m.key)])
);

// Ép server-render (thay vì Next thử static-generate lúc build) — tránh lỗi
// "Cannot find module" khi build cố resolve module remote lúc prerender.
export async function getServerSideProps() {
  return { props: {} };
}

export default function BookingRoute() {
  // tenantId trong thực tế lấy từ session/subdomain của resto,
  // truyền xuống remote component như 1 prop bình thường.
  return <RemoteModuleRouter remoteMap={remoteMap} tenantId="tenant-demo-01" notFoundLabel="Không tìm thấy trang booking phù hợp" />;
}
