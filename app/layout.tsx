import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Formatura SaaS',
  description: 'Proposal and quotation management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="navbar">
          <div className="container">
            <h1>Formatura SaaS</h1>
            <nav>{/* Navigation will go here */}</nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
