const { services } = require('./services.config');

// Next 15: KHÔNG dùng @module-federation/nextjs-mf nữa — package này bắt buộc
// NEXT_PRIVATE_LOCAL_WEBPACK=true để ép webpack cài ngoài, phá vỡ plugin nội bộ của
// Next 15 (crash "TypeError: _resolveContext_stack.delete is not a function"). Team
// module-federation/core cũng đã deprecate nextjs-mf (issue #3153), khuyến nghị dùng
// @module-federation/runtime thuần — xem lib/services/loadRemoteComponent.js.
//
// Nhờ vậy next.config.js giờ CHỈ còn cần khai externals phía server: mỗi trang import
// remote qua React.lazy(loadRemoteComponent(...)), và dù remote không thực thi phía
// server (ssr thực tế bị chặn bởi getServerSideProps ép render-on-demand + fallback
// Suspense), Next vẫn cần biết các specifier "scope/Module" tồn tại lúc build server để
// tạo loadable-manifest cho hydration — nếu không sẽ ra lỗi "Module not found".
const serverExternals = [];
for (const service of services) {
  for (const mod of service.modules) {
    serverExternals.push(`${service.federationName}/${mod.remoteModule}`);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack(config, options) {
    if (options.isServer) {
      config.externals = [...(config.externals || []), ...serverExternals];
    }
    return config;
  },
};

module.exports = nextConfig;
