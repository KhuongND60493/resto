// Đăng ký TẤT CẢ service module (micro-frontend) mà resto tiêu thụ, tại 1 chỗ duy nhất.
// File này được dùng bởi:
//   - next.config.js (Node/CommonJS, lúc build) -> sinh `remotes` + `externals` cho
//     webpack Module Federation, không cần sửa next.config.js khi thêm service mới.
//   - lib/menu-config.ts (runtime) -> sinh menu sidebar tự động.
//   - lib/services/createBackendProxy.ts -> biết service nào cần proxy sang backend nào.
//
// Viết bằng .js (không phải .ts) vì next.config.js là CommonJS thuần, không qua
// TypeScript transpile — nhưng vẫn import bình thường được từ code .ts/.tsx của resto.
//
// ============================================================================
// THÊM SERVICE MỚI: chỉ cần thêm 1 object vào mảng `services` bên dưới, sau đó:
//   1. Tạo pages/<routePrefix>/[...slug].tsx (xem pages/booking/[...slug].tsx làm mẫu)
//   2. Tạo types/federation/<key>.d.ts khai type cho các module expose (xem
//      types/federation/bookingAdmin.d.ts làm mẫu)
//   3. Nếu cần gọi backend riêng: tạo pages/api/<routePrefix>/*.ts bằng
//      lib/services/createBackendProxy.ts (xem pages/api/booking/*.ts làm mẫu)
// KHÔNG cần sửa next.config.js hay lib/menu-config.ts — tự động nhận từ đây.
// ============================================================================
//
// ĐA MÔI TRƯỜNG (dev cloud / stg / prod): mỗi môi trường có domain remote khác nhau.
// Ưu tiên giải quyết bằng ENV VAR thật (set khác nhau ở từng deploy target — Vercel
// Project Settings > Environment Variables, hoặc .env.<env> nếu tự host) — đó là cách
// chuẩn, không hardcode domain vào code. `defaultRemoteUrl` bên dưới chỉ là LƯỚI AN
// TOÀN khi quên set env var, tự chọn theo APP_ENV (dev|staging|prod), không phải cơ
// chế chính. Nếu env var `remoteUrlEnv` đã set thì defaultRemoteUrl không được dùng tới.

/** @type {'dev' | 'staging' | 'prod'} */
const APP_ENV = /** @type {any} */ (process.env.APP_ENV) || 'dev';

/**
 * @typedef {object} ServiceModule
 * @property {string} key - route segment, vd 'reservations'
 * @property {string} label - label hiển thị trên sidebar
 * @property {string} path - full route path, vd '/booking/reservations'
 * @property {string} remoteModule - tên module đã expose bên remote, vd 'ReservationsPage'
 */

/**
 * @typedef {object} ServiceBackend
 * @property {string} baseUrlEnv - tên env var chứa URL backend thật
 * @property {string} serviceTokenEnv - tên env var chứa service token gọi backend
 */

/**
 * @typedef {object} ServiceConfig
 * @property {string} key - unique key, vd 'bookingAdmin'
 * @property {string} label - label nhóm menu, vd 'Booking'
 * @property {string} federationName - PHẢI khớp `name` trong NextFederationPlugin của remote
 * @property {string} remoteUrlEnv - tên env var chứa base URL của remote (CDN) — LUÔN ưu
 *   tiên hơn defaultRemoteUrl nếu có set, bất kể APP_ENV là gì.
 * @property {Record<'dev'|'staging'|'prod', string>} defaultRemoteUrl - URL fallback theo
 *   từng môi trường, dùng khi remoteUrlEnv chưa set.
 * @property {string} routePrefix - tiền tố route, vd '/booking'
 * @property {ServiceModule[]} modules - danh sách module expose từ service này
 * @property {ServiceBackend} [backend] - cấu hình proxy sang backend thật (optional)
 */

/** @type {ServiceConfig[]} */
const services = [
  {
    key: 'bookingAdmin',
    label: 'Booking',
    federationName: 'bookingAdmin',
    remoteUrlEnv: 'BOOKING_ADMIN_URL',
    defaultRemoteUrl: {
      // TODO: điền domain thật của từng môi trường khi có. Hiện chỉ có 1 deployment
      // (Vercel test) nên cả 3 tạm trỏ chung — không phải lỗi, chỉ chưa tách môi trường.
      dev: 'http://localhost:3001',
      staging: 'https://booking-admin-indol.vercel.app',
      prod: 'https://booking-admin-indol.vercel.app',
    },
    routePrefix: '/booking',
    modules: [
      { key: 'reservations', label: 'Đặt bàn', path: '/booking/reservations', remoteModule: 'ReservationsPage' },
      { key: 'tables', label: 'Sơ đồ bàn', path: '/booking/tables', remoteModule: 'TablesPage' },
    ],
    backend: {
      baseUrlEnv: 'BOOKING_BACKEND_URL',
      serviceTokenEnv: 'BOOKING_SERVICE_TOKEN',
    },
  },

  // Mẫu cho service tiếp theo — copy, đổi giá trị, bỏ comment:
  // {
  //   key: 'inventoryAdmin',
  //   label: 'Kho',
  //   federationName: 'inventoryAdmin',
  //   remoteUrlEnv: 'INVENTORY_ADMIN_URL',
  //   defaultRemoteUrl: {
  //     dev: 'https://inventory-admin-dev.vercel.app',
  //     staging: 'https://inventory-admin-stg.vercel.app',
  //     prod: 'https://inventory-admin.example.com',
  //   },
  //   routePrefix: '/inventory',
  //   modules: [
  //     { key: 'stock', label: 'Tồn kho', path: '/inventory/stock', remoteModule: 'StockPage' },
  //   ],
  //   backend: {
  //     baseUrlEnv: 'INVENTORY_BACKEND_URL',
  //     serviceTokenEnv: 'INVENTORY_SERVICE_TOKEN',
  //   },
  // },
];

/**
 * Resolve URL thật sự dùng cho 1 service: env var override trước, không có thì fallback
 * theo APP_ENV hiện tại (mặc định 'prod' nếu APP_ENV lạ/không set default cho môi trường đó).
 * @param {ServiceConfig} service
 * @returns {string}
 */
function resolveRemoteUrl(service) {
  return process.env[service.remoteUrlEnv] || service.defaultRemoteUrl[APP_ENV] || service.defaultRemoteUrl.prod;
}

module.exports = { services, resolveRemoteUrl, APP_ENV };
