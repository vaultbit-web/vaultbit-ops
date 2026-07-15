import { createClient } from "~/lib/supabase/server";

export interface ListParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ListResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

const DEFAULT_PAGE_SIZE = 50;

/**
 * Listado genérico de cualquier tabla con búsqueda en `email` y `name`,
 * orden por created_at desc y paginación. Si la tabla no tiene `name`
 * o `email`, los filtros simplemente no aplican (Postgres ignora la
 * condición OR para columnas inexistentes vía PostgREST `or=` con .ilike).
 *
 * Diseñado para fallar suavemente: si la query rompe, devuelve lista vacía
 * en lugar de tirar la página. Logueamos a consola para que se vea en Dokploy.
 */
export async function listTable<T>(
  table: string,
  params: ListParams,
  searchableFields: string[] = ["name", "email"],
): Promise<ListResult<T>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = await createClient();
    let query = supabase
      .from(table)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (params.q && params.q.trim().length > 0) {
      const q = params.q.trim().replace(/[,%()]/g, "");
      const orFilter = searchableFields
        .map((f) => `${f}.ilike.%${q}%`)
        .join(",");
      query = query.or(orFilter);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error(`[crm.listTable] ${table}:`, error.message);
      return { rows: [], total: 0, page, pageSize, pages: 0 };
    }

    const total = count ?? 0;
    return {
      rows: (data ?? []) as T[],
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (err) {
    console.error(`[crm.listTable] ${table} threw:`, err);
    return { rows: [], total: 0, page, pageSize, pages: 0 };
  }
}
