const { NextFederationPlugin } = require('@module-federation/nextjs-mf');
const { services } = require('./services.config');

// Dynamic remote: KHÔNG hardcode version vào URL lúc build. Thay vào đó, remote value là
// 1 đoạn code "promise new Promise(...)" — webpack hỗ trợ cú pháp này để resolve remote
// container lúc RUNTIME thay vì lúc build. Ở đây ta fetch registry.json (do service đó tự
// sinh ra, cache ngắn) để lấy version "stable" hiện tại, rồi mới load đúng remoteEntry đó.
//
// Nhờ vậy: service release version mới KHÔNG bắt buộc resto phải build lại — chỉ cần
// promote bên service đó là resto tự nhận version mới ở lần load tiếp theo.
// Sinh 1 lần cho MỌI service trong services.config.js — không cần viết tay từng cái.
function buildDynamicRemote(service) {
  const remoteUrl = process.env[service.remoteUrlEnv] || service.defaultRemoteUrl;
  const scope = service.federationName;
  return `promise new Promise((resolve, reject) => {
  if (typeof window === 'undefined') { reject(new Error('${scope} remote is client-only')); return; }
  if (window['${scope}']) { resolve(window['${scope}']); return; }
  fetch('${remoteUrl}/registry.json', { cache: 'no-store' })
    .then((res) => res.json())
    .then((registry) => {
      const script = document.createElement('script');
      script.src = '${remoteUrl}/_next/static/chunks/remoteEntry.' + registry.stable + '.js';
      script.onload = () => {
        if (window['${scope}']) resolve(window['${scope}']);
        else reject(new Error('${scope} container not found after script load'));
      };
      script.onerror = () => reject(new Error('Failed to load remoteEntry for ${scope}'));
      document.head.appendChild(script);
    })
    .catch(reject);
})`;
}

const remotes = {};
// Danh sách specifier remote mà các trang resto import qua React.lazy(import(...)). Dù
// ssr:false đảm bảo remote KHÔNG được thực thi phía server, Next vẫn cần biết module này
// "tồn tại" lúc build server để tạo loadable-manifest cho hydration — nếu không sẽ ra lỗi
// "Module not found" và server build fail ngay từ đầu. Khai externals thuần webpack ở
// server để né lỗi mà không cần bật federation đầy đủ (từng làm null hoá React runtime SSR).
const serverExternals = [];

for (const service of services) {
  remotes[service.federationName] = buildDynamicRemote(service);
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
      return config;
    }

    config.plugins.push(
      new NextFederationPlugin({
        name: 'resto',
        filename: 'static/chunks/remoteEntry.js',
        remotes,
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
