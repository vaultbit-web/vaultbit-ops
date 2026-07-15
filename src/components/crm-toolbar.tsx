import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

interface CrmToolbarProps {
  basePath: string;
  q?: string;
  page: number;
  pages: number;
  total: number;
  searchPlaceholder?: string;
}

export function CrmToolbar({
  basePath,
  q,
  page,
  pages,
  total,
  searchPlaceholder = "Buscar por nombre o email…",
}: CrmToolbarProps) {
  const prevHref = page > 1 ? `${basePath}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}` : null;
  const nextHref = page < pages ? `${basePath}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}` : null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <form action={basePath} method="GET" className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-anthracite-400 pointer-events-none" strokeWidth={1.5} />
        <input
          name="q"
          defaultValue={q}
          type="search"
          placeholder={searchPlaceholder}
          className="w-full h-11 md:h-10 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 pl-10 pr-3 text-base md:text-sm text-fg placeholder:text-anthracite-400 focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40"
        />
      </form>

      <div className="flex items-center gap-3 text-xs text-anthracite-200">
        <span className="hidden sm:inline">
          {total} resultados · página {page} de {pages}
        </span>
        <span className="sm:hidden">{total} · {page}/{pages}</span>
        <div className="flex items-center gap-1">
          <PaginationLink href={prevHref} aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </PaginationLink>
          <PaginationLink href={nextHref} aria-label="Página siguiente">
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </PaginationLink>
        </div>
      </div>
    </div>
  );
}

function PaginationLink({
  href,
  children,
  ...props
}: { href: string | null; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const className = cn(
    "inline-flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-[8px] border border-anthracite-600/60 transition-colors",
    href
      ? "text-anthracite-100 hover:bg-anthracite-800 hover:text-fg"
      : "text-anthracite-400/50 cursor-not-allowed",
  );

  if (!href) {
    return (
      <span className={className} aria-disabled {...props}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}
