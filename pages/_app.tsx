import type { AppProps } from 'next/app';
import Sidebar from '../components/Sidebar';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 24 }}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
