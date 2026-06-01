"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface BeaconProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * The one CTA shape across the whole product: ──── label ────
 * Never "Submit". Always an invitation.
 */
export function Beacon({ children, href, onClick, className }: BeaconProps) {
  const inner = (
    <>
      <span className="text-mist/45 text-[10px] tracking-[-0.05em]">────</span>
      <span className="px-1.5 font-sans">{children}</span>
      <span className="text-mist/45 text-[10px] tracking-[-0.05em]">────</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("beacon", className)}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn("beacon", className)}>
      {inner}
    </button>
  );
}
