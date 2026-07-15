import { Skeleton } from "~/components/ui/skeleton";

/**
 * Skeleton de navegación compartido por todas las rutas de (app).
 * Next.js lo muestra al instante al navegar mientras el RSC consulta datos,
 * lo que hace la transición percibida inmediata (clave en móvil).
 */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-52 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Skeleton className="h-32 rounded-[24px]" />
        <Skeleton className="h-32 rounded-[24px]" />
        <Skeleton className="h-32 rounded-[24px]" />
        <Skeleton className="h-32 rounded-[24px]" />
      </div>
      <Skeleton className="h-64 rounded-[24px]" />
      <Skeleton className="h-40 rounded-[24px]" />
    </div>
  );
}
