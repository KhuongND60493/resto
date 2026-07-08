const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

// Versioned remote URL — KHÔNG trỏ vào "latest".
// Bump thủ công (qua PR) mỗi khi muốn nhận version mới của booking-admin.
// Version phải khớp REMOTE_VERSION đã build bên booking-admin, vì filename remoteEntry
// trên CDN được nhúng version trực tiếp (remoteEntry.<version>.js) — Vercel ép cache
// immutable 1 năm cho mọi thứ dưới _next/static/ nên không thể dùng tên cố định.
const BOOKING_ADMIN_REMOTE_VERSION = '1.0.0';
const BOOKING_ADMIN_URL =
  process.env.BOOKING_ADMIN_URL || 'https://booking-admin-indol.vercel.app';

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
          bookingAdmin: `bookingAdmin@${BOOKING_ADMIN_URL}/_next/static/chunks/remoteEntry.${BOOKING_ADMIN_REMOTE_VERSION}.js`,
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
