import { redirect } from "next/navigation";

export type SearchParams = { organization_id?: string; branch_id?: string };

/**
 * Utility to resolve search parameters and fetch page data with automatic redirect on failure.
 * Used to DRY up boilerplate code in dashboard page components.
 */
export async function resolvePageData<T>(
  searchParams: Promise<SearchParams>,
  fetcher: (filters: SearchParams) => Promise<T | null | undefined>
): Promise<T> {
  const filters = await searchParams;
  const data = await fetcher(filters);

  if (data === null || data === undefined) {
    redirect("/login");
  }

  return data;
}
