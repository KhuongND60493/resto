export interface MenuItem {
  key: string;
  label: string;
  path: string;
}

export interface MenuGroup {
  key: string;
  label: string;
  items: MenuItem[];
}

/**
 * Menu của resto khai báo tĩnh ở đây (theo yêu cầu: quản lý menu con của Booking
 * ngay trong resto, không fetch runtime từ booking-admin).
 *
 * Lưu ý: "key" của mỗi item trong nhóm "booking" phải khớp với case trong
 * pages/booking/[...slug].tsx (nơi map key -> remote component tương ứng),
 * và khớp với tên module đã expose bên booking-admin/next.config.js.
 */
export const MENU_GROUPS: MenuGroup[] = [
  {
    key: 'dashboard',
    label: 'Tổng quan',
    items: [{ key: 'home', label: 'Trang chủ', path: '/' }],
  },
  {
    key: 'booking',
    label: 'Booking',
    items: [
      { key: 'reservations', label: 'Đặt bàn', path: '/booking/reservations' },
      { key: 'tables', label: 'Sơ đồ bàn', path: '/booking/tables' },
    ],
  },
  {
    key: 'settings',
    label: 'Cài đặt',
    items: [{ key: 'settings-general', label: 'Chung', path: '/settings' }],
  },
];
