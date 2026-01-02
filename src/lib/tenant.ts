/**
 * Tenant Context Utilities
 *
 * Helper functions to get and manage tenant (organization/branch) context
 * for multi-tenancy support. Used by all server actions to filter data.
 */

import { createClient } from "@/utils/supabase/server";

export interface TenantContext {
  userId: string;
  isSuperAdmin: boolean;
  organizationId: string | null;
  branchId: string | null;
  organizationName?: string;
  branchName?: string;
}

/**
 * Get the current authenticated user's tenant context
 * This should be called at the start of every server action
 *
 * @returns TenantContext or null if user is not authenticated
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's profile with organization and branch info
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      id,
      is_super_admin,
      organization_id,
      branch_id,
      organizations (
        name
      ),
      branches (
        name
      )
    `
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  // Type-safe extraction of nested data
  // Supabase may return an array or a single object depending on the library version and query structure
  const orgData = profile.organizations as unknown;
  const branchData = profile.branches as unknown;

  const organization = Array.isArray(orgData) ? orgData[0] : orgData;
  const branch = Array.isArray(branchData) ? branchData[0] : branchData;

  return {
    userId: profile.id,
    isSuperAdmin: profile.is_super_admin || false,
    organizationId: profile.organization_id || null,
    branchId: profile.branch_id || null,
    organizationName: (organization as { name: string })?.name,
    branchName: (branch as { name: string })?.name,
  };
}

/**
 * Ensure user is authenticated and return tenant context
 * Throws error if not authenticated
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const context = await getTenantContext();

  if (!context) {
    throw new Error("Unauthorized: User not authenticated");
  }

  return context;
}

/**
 * Ensure user is a super admin
 * Throws error if not super admin
 */
export async function requireSuperAdmin(): Promise<TenantContext> {
  const context = await requireTenantContext();

  if (!context.isSuperAdmin) {
    throw new Error("Forbidden: Super admin access required");
  }

  return context;
}

/**
 * Get organization filter for queries
 * Returns the WHERE clause condition for organization-level tables
 *
 * @param context - Tenant context
 * @param tableAlias - Optional table alias for the query
 * @returns Object with organization_id to filter by, or null for super admin
 */
export function getOrganizationFilter(
  context: TenantContext
): { organization_id: string } | null {
  if (context.isSuperAdmin) {
    return null; // Super admin sees all
  }

  if (!context.organizationId) {
    throw new Error("User must belong to an organization");
  }

  return { organization_id: context.organizationId };
}

/**
 * Get branch filter for queries
 * Returns the WHERE clause condition for branch-level tables
 *
 * @param context - Tenant context
 * @param tableAlias - Optional table alias for the query
 * @returns Object with branch_id to filter by, or null for super admin
 */
export function getBranchFilter(
  context: TenantContext
): { branch_id: string } | null {
  if (context.isSuperAdmin) {
    return null; // Super admin sees all
  }

  if (!context.branchId) {
    throw new Error("User must belong to a branch");
  }

  return { branch_id: context.branchId };
}

/**
 * Apply organization filter to a Supabase query builder
 *
 * @param query - Supabase query builder
 * @param context - Tenant context
 * @param column - Column name to filter on (default: 'organization_id')
 * @returns Modified query builder
 */
export function applyOrganizationFilter(
  query: any,
  context: TenantContext,
  column: string = "organization_id"
): any {
  if (context.isSuperAdmin) {
    return query; // No filter for super admin
  }

  if (!context.organizationId) {
    throw new Error("User must belong to an organization");
  }

  return query.eq(column, context.organizationId);
}

/**
 * Apply branch filter to a Supabase query builder
 *
 * @param query - Supabase query builder
 * @param context - Tenant context
 * @param column - Column name to filter on (default: 'branch_id')
 * @returns Modified query builder
 */
export function applyBranchFilter(
  query: any,
  context: TenantContext,
  column: string = "branch_id"
): any {
  if (context.isSuperAdmin) {
    return query; // No filter for super admin
  }

  if (!context.branchId) {
    throw new Error("User must belong to a branch");
  }

  return query.eq(column, context.branchId);
}

/**
 * Get default values for creating organization-level entities
 *
 * @param context - Tenant context
 * @returns Object with organization_id
 */
export function getOrganizationDefaults(context: TenantContext): {
  organization_id: string;
} {
  if (!context.organizationId) {
    throw new Error("User must belong to an organization to create entities");
  }

  return {
    organization_id: context.organizationId,
  };
}

/**
 * Get default values for creating branch-level entities
 *
 * @param context - Tenant context
 * @returns Object with branch_id
 */
export function getBranchDefaults(context: TenantContext): {
  branch_id: string;
} {
  if (!context.branchId) {
    throw new Error("User must belong to a branch to create entities");
  }

  return {
    branch_id: context.branchId,
  };
}
