import { services } from '../services.config';

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
 * Menu sidebar sinh tự động từ services.config.js — thêm service mới ở đó thì menu
 * tự cập nhật, không cần sửa file này.
 */
export const MENU_GROUPS: MenuGroup[] = [
  {
    key: 'dashboard',
    label: 'Tổng quan',
    items: [{ key: 'home', label: 'Trang chủ', path: '/' }],
  },
  ...services.map((service) => ({
    key: service.key,
    label: service.label,
    items: service.modules.map((m) => ({
      key: m.key,
      label: m.label,
      path: m.path,
    })),
  })),
  {
    key: 'settings',
    label: 'Cài đặt',
    items: [{ key: 'settings-general', label: 'Chung', path: '/settings' }],
  },
];
