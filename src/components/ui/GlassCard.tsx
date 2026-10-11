import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export function GlassCard({
  children,
  className,
  strong,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; strong?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-2xl",
        strong ? "glass-strong" : "glass",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
