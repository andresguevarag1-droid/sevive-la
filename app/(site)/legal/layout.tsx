/** Marco común de las páginas legales: columna de lectura angosta. */
export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">{children}</div>;
}
