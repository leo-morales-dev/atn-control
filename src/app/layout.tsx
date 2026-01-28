import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ContentWrapper } from "@/components/ContentWrapper";
import { SessionGuard } from "@/components/SessionGuard";
import { Toaster } from "sonner"; // Importamos el componente de alertas

const sourceSans = Source_Sans_3({ subsets: ["latin"] });

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
      <body className={`${sourceSans.className} bg-gray-50 text-[#444444]`}>
        <SessionGuard /> 
        
        <div className="flex min-h-screen">
          <Sidebar />
          <ContentWrapper>
            {children}
            {/* CONFIGURACIÓN DE ALERTAS ACTUALIZADA */}
            <Toaster 
                position="top-right"   // <-- Aquí movemos las alertas arriba
                richColors             // <-- Colores estilo tarjeta (Rojo/Verde)
                closeButton            // <-- Botón de cerrar
                expand={true}          // <-- Evita que se apilen demasiado
            />
          </ContentWrapper>
        </div>
      </body>
    </html>
  );
}