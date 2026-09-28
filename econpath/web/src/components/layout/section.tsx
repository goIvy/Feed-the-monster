import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="mb-3 text-[12.5px] font-semibold tracking-wide text-primary">{eyebrow}</p>}
        <h2 className="text-3xl font-semibold tracking-tight sm:text-[40px] sm:leading-[1.08]">{title}</h2>
        {description && <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-[17px]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="bg-hero absolute inset-0 opacity-70" />
      <div className="container-page relative py-10 sm:py-14">
        {eyebrow && <p className="mb-3 text-[12.5px] font-semibold tracking-wide text-primary">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>}
        {children}
      </div>
    </div>
  );
}
