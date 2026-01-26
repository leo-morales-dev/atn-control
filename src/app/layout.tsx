import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar"; // <--- Importamos
import { ContentWrapper } from "@/components/ContentWrapper"; // <--- Importalo
import { SessionGuard } from "@/components/SessionGuard"; // <--- Importar
import { Toaster } from "sonner"; // <--- Importar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ATN Control",
  description: "Control de herramientas y consumibles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-zinc-900`}>
        {/* Agrega el guardia aquí, antes del contenido */}
        <SessionGuard /> 
        
        <div className="flex min-h-screen">
          <Sidebar />
          <ContentWrapper>
            {children}
            <Toaster />
          </ContentWrapper>
        </div>
      </body>
    </html>
  );
}