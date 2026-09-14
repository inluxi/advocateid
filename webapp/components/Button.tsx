import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "on-colour";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "border border-brand bg-bg text-brand-ink hover:bg-ink-100",
  tertiary: "text-brand-ink hover:bg-ink-100",
  "on-colour": "bg-white text-brand-ink hover:bg-ink-100",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-4 text-small font-semibold",
  md: "h-11 px-4 text-small font-semibold",
  lg: "h-12 px-[22px] text-small font-bold",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  href,
  ...rest
}: CommonProps & ({ href: string } & ComponentPropsWithoutRef<typeof Link>)) {
  const classes = `inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`;
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}

export function ButtonEl({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<"button">) {
  const classes = `inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
