const { NextFederationPlugin } = require('@module-federation/nextjs-mf');
const { services, resolveRemoteUrl, APP_ENV } = require('./services.config');

// DEV STUB: khi chạy "yarn dev", resto KHÔNG gọi mạng sang remote thật (booking-admin
// nằm ở git repo khác, có thể chưa chạy/chưa deploy lúc đang code resto). Container trả
// về là 1 object literal thoả interface container tối thiểu của Module Federation
// (init/get), get() trả 1 component placeholder duy nhất bất kể module nào được yêu cầu —
// không fetch registry.json, không tải remoteEntry.js, không phụ thuộc booking-admin.
//
// Không dùng React.createElement/JSX ở đây vì đoạn code này là 1 CHUỖI được webpack chèn
// nguyên văn vào bundle như 1 module riêng — không có sẵn biến `React` trong scope đó.
// Trả về string thô từ function component vẫn hợp lệ với React (render như text node).
function buildDevStubRemote(scope) {
  return `promise Promise.resolve({
  init: function () { return Promise.resolve(); },
  get: function (request) {
    var name = request.replace(/^\\.\\//, '');
    return Promise.resolve(function () {
      return {
        __esModule: true,
        default: function DevStubComponent() {
          return 'will load component ' + name;
        },
      };
    });
  },
})`;
}

// Dynamic remote (production/build): KHÔNG hardcode version vào URL lúc build. Thay vào
// đó, remote value là 1 đoạn code "promise new Promise(...)" — webpack hỗ trợ cú pháp này
// để resolve remote container lúc RUNTIME thay vì lúc build. Ở đây ta fetch registry.json
// (do service đó tự sinh ra, cache ngắn) để lấy version "stable" hiện tại, rồi mới load
// đúng remoteEntry đó.
//
// Nhờ vậy: service release version mới KHÔNG bắt buộc resto phải build lại — chỉ cần
// promote bên service đó là resto tự nhận version mới ở lần load tiếp theo.
function buildProductionRemote(service) {
  const remoteUrl = resolveRemoteUrl(service);
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

// Danh sách specifier remote mà các trang resto import qua React.lazy(import(...)). Dù
// ssr:false đảm bảo remote KHÔNG được thực thi phía server, Next vẫn cần biết module này
// "tồn tại" lúc build server để tạo loadable-manifest cho hydration — nếu không sẽ ra lỗi
// "Module not found" và server build fail ngay từ đầu. Khai externals thuần webpack ở
// server để né lỗi mà không cần bật federation đầy đủ (từng làm null hoá React runtime SSR).
// Áp dụng cho cả dev lẫn production — server không bao giờ thật sự chạy code remote.
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
      return config;
    }

    const remotes = {};
    for (const service of services) {
      remotes[service.federationName] = options.dev
        ? buildDevStubRemote(service.federationName)
        : buildProductionRemote(service);
    }

    if (options.dev) {
      console.log(
        `[services.config] yarn dev — dùng DEV STUB cho remote: ${services.map((s) => s.federationName).join(', ')} (không gọi mạng sang remote thật)`
      );
    } else {
      console.log(
        `[services.config] APP_ENV=${APP_ENV} — remote URL đã resolve: ${services
          .map((s) => `${s.key}=${resolveRemoteUrl(s)}`)
          .join(', ')}`
      );
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
