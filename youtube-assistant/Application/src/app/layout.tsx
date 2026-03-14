import type { Metadata } from 'next';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'YouTube Assistant',
  description: 'Find high-quality educational videos without wasting time on clickbait',
};

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else if (stored === 'light') {
      document.documentElement.dataset.theme = 'light';
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.dataset.theme = 'light';
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
