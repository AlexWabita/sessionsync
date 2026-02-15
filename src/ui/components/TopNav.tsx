"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "px-3 py-2 rounded-lg text-sm border transition",
        active ? "font-semibold" : "opacity-80 hover:opacity-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function TopNav() {
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
      <div className="p-4 sm:p-6 flex items-center justify-between gap-3">
        <div className="font-semibold">SessionSync</div>
        <div className="flex items-center gap-2">
          <NavLink href="/" label="Today" />
          <NavLink href="/week" label="Week" />
          <NavLink href="/settings" label="Settings" />
        </div>
      </div>
    </div>
  );
}
