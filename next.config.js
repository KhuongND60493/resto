const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

// Domain của booking-admin — hiếm khi đổi (khác với version, đổi liên tục mỗi release).
const BOOKING_ADMIN_URL =
  process.env.BOOKING_ADMIN_URL || 'https://booking-admin-indol.vercel.app';

// Dynamic remote: KHÔNG hardcode version vào URL lúc build nữa. Thay vào đó, remote value
// là 1 đoạn code "promise new Promise(...)" — webpack hỗ trợ cú pháp này để resolve remote
// container lúc RUNTIME thay vì lúc build. Ở đây ta fetch registry.json (do booking-admin
// sinh ra, cache ngắn) để lấy version "stable" hiện tại, rồi mới load đúng remoteEntry đó.
//
// Nhờ vậy: booking-admin release version mới KHÔNG bắt buộc resto phải build lại — chỉ cần
// ai đó promote (đổi "stable" trong registry.source.json bên booking-admin + deploy lại
// booking-admin) là resto tự nhận version mới ở lần load tiếp theo.
const BOOKING_ADMIN_REMOTE = `promise new Promise((resolve, reject) => {
  if (typeof window === 'undefined') { reject(new Error('bookingAdmin remote is client-only')); return; }
  if (window.bookingAdmin) { resolve(window.bookingAdmin); return; }
  fetch('${BOOKING_ADMIN_URL}/registry.json', { cache: 'no-store' })
    .then((res) => res.json())
    .then((registry) => {
      const script = document.createElement('script');
      script.src = '${BOOKING_ADMIN_URL}/_next/static/chunks/remoteEntry.' + registry.stable + '.js';
      script.onload = () => {
        if (window.bookingAdmin) resolve(window.bookingAdmin);
        else reject(new Error('bookingAdmin container not found after script load'));
      };
      script.onerror = () => reject(new Error('Failed to load remoteEntry for bookingAdmin'));
      document.head.appendChild(script);
    })
    .catch(reject);
})`;

// Đây là danh sách specifier remote mà các trang resto import qua next/dynamic(ssr:false).
// Dù ssr:false đảm bảo remote KHÔNG được thực thi phía server, Next vẫn cần biết module
// này "tồn tại" lúc build server để tạo loadable-manifest cho hydration — nếu không sẽ ra
// lỗi "Module not found" và server build fail ngay từ đầu (khiến client compiler không bao
// giờ chạy tới). Khai externals thuần webpack ở server để né lỗi mà không cần bật federation
// đầy đủ (dùng NextFederationPlugin đầy đủ ở server từng làm null hoá React runtime ở SSR).
const BOOKING_ADMIN_REMOTE_SPECIFIERS = [
  'bookingAdmin/ReservationsPage',
  'bookingAdmin/TablesPage',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack(config, options) {
    if (options.isServer) {
      config.externals = [...(config.externals || []), ...BOOKING_ADMIN_REMOTE_SPECIFIERS];
      return config;
    }

    config.plugins.push(
      new NextFederationPlugin({
        name: 'resto',
        filename: 'static/chunks/remoteEntry.js',
        remotes: {
          bookingAdmin: BOOKING_ADMIN_REMOTE,
        },
        shared: {
          react: { singleton: true, requiredVersion: false },
          'react-dom': { singleton: true, requiredVersion: false },
        },
      })
    );

    return config;
  },
};

module.exports = nextConfig;
