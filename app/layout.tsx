import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GitAI — AI GitHub Developer Assistant',
  description: 'Explore GitHub repositories, inspect code, and use Gemini-powered developer tools.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
