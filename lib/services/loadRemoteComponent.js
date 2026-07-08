import React from 'react';
import ReactDOM from 'react-dom';
import { init, loadRemote } from '@module-federation/runtime';
import { resolveRemoteUrl } from '../../services.config';

// Thay cho next.config.js "promise new Promise(...)" của bản Next 13 — @module-federation
// /runtime là API thuần JS (init() + loadRemote()), không cần webpack ModuleFederationPlugin
// nào cả, nên không đụng tới internals của Next 15. Xem doc "Next.js 15 — thay đổi kiến trúc
// bắt buộc" để biết lý do đầy đủ.
const IS_DEV = process.env.NODE_ENV === 'development';
const initedServices = new Set();

async function ensureInit(service) {
  if (initedServices.has(service.federationName)) return;

  const remoteUrl = resolveRemoteUrl(service);
  const res = await fetch(`${remoteUrl}/registry.json`, { cache: 'no-store' });
  const registry = await res.json();

  init({
    name: 'resto',
    remotes: [
      {
        name: service.federationName,
        entry: `${remoteUrl}/_next/static/chunks/remoteEntry.${registry.stable}.js`,
      },
    ],
    shared: {
      // BẮT BUỘC khai `lib` trỏ về đúng instance React của resto — thiếu dòng này sẽ ra
      // lỗi "Invalid hook call" / "Cannot read properties of undefined (ReactCurrentOwner)"
      // do remote tự bundle 1 React riêng thay vì dùng chung với host.
      react: {
        version: React.version,
        shareConfig: { singleton: true, requiredVersion: false },
        lib: () => React,
      },
      'react-dom': {
        version: ReactDOM.version,
        shareConfig: { singleton: true, requiredVersion: false },
        lib: () => ReactDOM,
      },
    },
  });

  initedServices.add(service.federationName);
}

// DEV STUB: resto và các service (booking-admin, ...) nằm ở git repo khác nhau — yarn dev
// của resto không nên phụ thuộc mạng/tình trạng sẵn sàng của service đó. Trả về component
// placeholder duy nhất, không fetch registry.json, không tải remoteEntry.js.
function devStub(moduleName) {
  return Promise.resolve({
    default: () => `will load component ${moduleName}`,
  });
}

/**
 * @param {import('../../services.config').ServiceConfig} service
 * @param {string} moduleKey - khớp `modules[].key` trong services.config.js
 */
export function loadRemoteComponent(service, moduleKey) {
  const mod = service.modules.find((m) => m.key === moduleKey);
  if (!mod) {
    throw new Error(`Không tìm thấy module "${moduleKey}" trong service "${service.key}"`);
  }

  return React.lazy(async () => {
    if (IS_DEV) {
      return devStub(mod.remoteModule);
    }
    await ensureInit(service);
    return loadRemote(`${service.federationName}/${mod.remoteModule}`);
  });
}
