import type { ReactNode } from "react";
import { CpuIcon } from "./icons";

interface ConsoleHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  deviceName?: string;
  userName?: string;
  osName?: string;
  children?: ReactNode;
}

export function ConsoleHeader({
  eyebrow = "Testosteronium · My Device",
  title,
  subtitle,
  deviceName,
  userName,
  osName,
  children,
}: ConsoleHeaderProps) {
  return (
    <header className="relative">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
          <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-teal" />
          {eyebrow}
        </span>

        {deviceName ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-surface/70 px-2.5 py-1 font-mono text-[11px] text-muted">
            <CpuIcon className="h-3.5 w-3.5 text-faint" />
            <span className="text-ink/90">{deviceName}</span>
            {userName ? <span className="text-faint">· {userName}</span> : null}
            {osName ? <span className="text-faint">· {osName}</span> : null}
          </span>
        ) : null}
      </div>

      <h1 className="mt-4 font-mono text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p>
      ) : null}

      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}
