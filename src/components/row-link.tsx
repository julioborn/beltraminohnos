"use client";

import Link from "next/link";

export function RowLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={(e) => e.stopPropagation()} className={className}>
      {children}
    </Link>
  );
}
