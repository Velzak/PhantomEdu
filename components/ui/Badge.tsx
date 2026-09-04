import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: "muted" | "signal" | "accent" | "danger";
  className?: string;
}) {
  const tones = {
    muted: "bg-surface-2 text-muted",
    signal: "bg-signal/15 text-signal",
    accent: "bg-accent/20 text-ink",
    danger: "bg-danger/15 text-danger",
  };
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
