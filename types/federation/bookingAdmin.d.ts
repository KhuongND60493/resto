// Type contract tối thiểu cho các module remote từ booking-admin.
// Trong thực tế nên tách thành package riêng versioned: @skybooking/mf-contract,
// publish lên npm private, import type-only ở đây thay vì khai báo tay.
//
// Mỗi service mới thêm vào services.config.js nên có 1 file .d.ts riêng ở đây
// (vd. inventoryAdmin.d.ts) — tsconfig.json đã include cả thư mục types/federation/.
declare module 'bookingAdmin/ReservationsPage' {
  interface Props {
    tenantId: string;
  }
  const ReservationsPage: React.ComponentType<Props>;
  export default ReservationsPage;
}

declare module 'bookingAdmin/TablesPage' {
  interface Props {
    tenantId: string;
  }
  const TablesPage: React.ComponentType<Props>;
  export default TablesPage;
}
