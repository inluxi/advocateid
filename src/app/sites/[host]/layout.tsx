/** Premium sites render without any platform header or footer (white-label); each page supplies its own chrome. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <main id="main">{children}</main>;
}
