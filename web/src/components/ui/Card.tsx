import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function Card({
  children,
  title,
  description,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8 ${className}`}
      {...props}
    >
      {(title || description) && (
        <div className="mb-6 space-y-1">
          {title && (
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
