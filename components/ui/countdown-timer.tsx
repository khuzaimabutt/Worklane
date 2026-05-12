"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface CountdownProps {
  to: string | Date;
  className?: string;
  prefix?: string;
}

function diff(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return { overdue: true, days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return { overdue: false, days, hours, minutes };
}

export function CountdownTimer({ to, className, prefix }: CountdownProps) {
  const target = typeof to === "string" ? new Date(to) : to;
  const [d, setD] = useState(() => diff(target));

  useEffect(() => {
    const i = setInterval(() => setD(diff(target)), 60000);
    return () => clearInterval(i);
  }, [target]);

  if (d.overdue) {
    return <span className={cn("text-error font-semibold", className)}>Overdue</span>;
  }

  const parts = [];
  if (d.days > 0) parts.push(`${d.days}d`);
  if (d.hours > 0) parts.push(`${d.hours}h`);
  if (d.minutes > 0 || parts.length === 0) parts.push(`${d.minutes}m`);

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix} {parts.join(" ")}
    </span>
  );
}
