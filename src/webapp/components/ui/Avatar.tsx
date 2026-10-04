import { imageUrl } from "@/lib/storage";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0]?.toUpperCase() ?? "")
    .join("");

/** Profile picture (200 / 800 px sizes) or an initials tile. Alt text is the page's own alt text or the name. */
export function Avatar({ name, photoKey, size = "s", className = "avatar", alt }: { name: string; photoKey: string | null; size?: "s" | "m" | "l"; className?: string; alt?: string | null }) {
  const src = imageUrl(photoKey, size);
  if (src) return <img className={className} src={src} alt={alt || name} loading="lazy" decoding="async" />;
  return (
    <div className={`${className} avatar-initials`} role="img" aria-label={name}>
      {initials(name)}
    </div>
  );
}
