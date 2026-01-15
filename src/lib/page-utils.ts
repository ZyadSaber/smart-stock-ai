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

/**
 * Client-side utility to merge URL parameters and form filters then execute a server action.
 * This mimics resolvePageData but is designed for client-side event handlers (like onClick).
 */
export async function resolveActionData<T>(
  action: (
    filters: Record<string, unknown>
  ) => Promise<{ data?: T; error?: string }>,
  searchParams: URLSearchParams,
  formData: Record<string, unknown> = {}
): Promise<T | null> {
  const filters = {
    ...Object.fromEntries(searchParams.entries()),
    ...formData,
  };

  const { data, error } = await action(filters);

  if (error) {
    console.error("Action Fetch Error:", error);
    return null;
  }

  return data || null;
}
