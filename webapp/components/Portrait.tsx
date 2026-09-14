import Image from "next/image";

/** Enforces the design system's binding 4:5 portrait ratio, white ground, square corners. */
export function Portrait({
  src,
  alt,
  sizes = "(min-width: 1200px) 300px, 50vw",
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-portrait w-full overflow-hidden bg-white ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
