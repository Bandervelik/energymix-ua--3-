import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'EnergyMix UA | Гібридна Енергія',
  description: 'Розрахунок гібридних систем відновлюваної енергетики',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="uk" className="dark">
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-200 transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
