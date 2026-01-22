export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Fondo blanco puro, sin márgenes forzados del navegador
    <div className="min-h-screen bg-white text-black p-0 m-0">
      {children}
    </div>
  )
}