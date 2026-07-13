import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "igot — Leia qualquer coisa. Entenda tudo.",
  description:
    "Leitor de e-books com IA integrada: traduza e explique qualquer trecho, em qualquer língua.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
