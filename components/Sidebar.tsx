import { useRouter } from 'next/router';
import Link from 'next/link';
import { MENU_GROUPS } from '../lib/menu-config';

export default function Sidebar() {
  const router = useRouter();

  return (
    <nav style={{ width: 220, borderRight: '1px solid #eee', padding: 16, height: '100vh' }}>
      {MENU_GROUPS.map((group) => (
        <div key={group.key} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>
            {group.label}
          </div>
          {group.items.map((item) => {
            const active = router.asPath === item.path || router.asPath.startsWith(item.path + '/');
            return (
              <Link
                key={item.key}
                href={item.path}
                style={{
                  display: 'block',
                  padding: '8px 10px',
                  borderRadius: 6,
                  marginBottom: 4,
                  textDecoration: 'none',
                  color: active ? '#111' : '#555',
                  background: active ? '#f1f1f1' : 'transparent',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
