import { cn } from "@/lib/utils";

/** EconPath mark: one origin branching into rising paths. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <defs>
        <linearGradient id="ep-mark" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#ep-mark)" />
      <path d="M7 23.5 C12 23.5 13 16 17 14.5 S 22.5 9 25.5 8.5" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13.2 19.5 C 16 19.5 19 18.5 25.5 17" fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      <circle cx="7" cy="23.5" r="2.1" fill="white" />
      <circle cx="25.5" cy="8.5" r="2.1" fill="white" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.03em]">EconPath</span>
    </span>
  );
}
