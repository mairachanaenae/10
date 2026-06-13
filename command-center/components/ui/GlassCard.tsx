import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionHeading({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="font-display text-[13px] font-semibold tracking-wide">{children}</h2>
      {hint ? <span className="ml-auto text-[11px] text-faint">{hint}</span> : null}
    </div>
  );
}
