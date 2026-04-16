import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)] focus-visible:outline-[var(--primary)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)] focus-visible:outline-[var(--primary)]",
  ghost:
    "text-[var(--text)] hover:bg-[var(--surface-hover)] focus-visible:outline-[var(--primary)]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
