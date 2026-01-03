"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { UserProfile, UserPermissions, Organizations } from "@/types/user";
import {
  requireTenantContext,
  applyOrganizationFilter,
  getOrganizationDefaults,
} from "@/lib/tenant";

// Admin client using service role key
const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase URL or Service Role Key in environment variables."
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Ensure user has permission to manage users
 * Allows super admins OR organization admins with 'users' permission
 */
async function ensureUserAdmin() {
  const context = await requireTenantContext();

  if (context.isSuperAdmin) return context;

  // Check if regular user has 'users' permission in their profile
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("permissions")
    .eq("id", context.userId)
    .single();

  const permissions = profile?.permissions as UserPermissions | null;
  if (!permissions?.users) {
    throw new Error("Forbidden: User management permission required");
  }

  return context;
}

export async function getUsers(): Promise<UserProfile[]> {
  try {
    const context = await ensureUserAdmin();
    const supabase = await createClient();

    let query = supabase
      .from("profiles")
      .select("*, organizations(name), branches(name)");

    query = applyOrganizationFilter(query, context);
    query = query.order("full_name");

    const { data, error } = await query;

    if (error) throw error;

    // Fix nested data structure for TypeScript
    return data.map((item) => ({
      ...item,
      organizations: Array.isArray(item.organizations)
        ? item.organizations[0]
        : item.organizations,
      branches: Array.isArray(item.branches) ? item.branches[0] : item.branches,
    })) as UserProfile[];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function createUserAction(formData: {
  email: string;
  full_name: string;
  password?: string;
}) {
  try {
    const context = await ensureUserAdmin();
    const adminClient = createAdminClient();

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: formData.email,
        email_confirm: true,
        user_metadata: { full_name: formData.full_name },
        password: formData.password || Math.random().toString(36).slice(-12),
      });

    if (authError) throw authError;

    // 2. Link to profiles
    // New users created by org-admins must belong to the same organization
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: authData.user.id,
      full_name: formData.full_name,
      is_super_admin: false,
      // ...getOrganizationDefaults(context), // Shared organization
      permissions: {
        dashboard: true,
        inventory: true,
        warehouses: true,
        "stock-movements": true,
        purchases: true,
        sales: true,
        users: false,
      },
    });

    if (profileError) throw profileError;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function updatePermissionsAction(
  userId: string,
  {
    permissions,
    organization_id,
    branch_id,
  }: {
    permissions: UserPermissions;
    organization_id: string;
    branch_id: string;
  }
) {
  try {
    const context = await ensureUserAdmin();
    const supabase = await createClient();

    // Ensure the target user belongs to the admin's organization (unless super admin)
    if (!context.isSuperAdmin) {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (targetProfile?.organization_id !== context.organizationId) {
        throw new Error(
          "Forbidden: Cannot manage users outside your organization"
        );
      }

      // Also prevent org-admins from changing the organization_id of users
      // They can only change branch_id within the same org
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        permissions,
        organization_id: context.isSuperAdmin
          ? organization_id || null
          : context.organizationId,
        branch_id: branch_id || null,
      })
      .eq("id", userId);

    if (error) throw error;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating permissions:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function updatePasswordAction(userId: string, password: string) {
  try {
    const context = await ensureUserAdmin();
    const supabase = await createClient();

    if (!context.isSuperAdmin) {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (targetProfile?.organization_id !== context.organizationId) {
        throw new Error(
          "Forbidden: Cannot manage users outside your organization"
        );
      }
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: password,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const context = await ensureUserAdmin();
    const supabase = await createClient();

    if (!context.isSuperAdmin) {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (targetProfile?.organization_id !== context.organizationId) {
        throw new Error(
          "Forbidden: Cannot manage users outside your organization"
        );
      }
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) throw error;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function getOrganizationsWithBranches() {
  try {
    const context = await requireTenantContext();
    const supabase = await createClient();

    let query = supabase.from("organizations").select(`
        *,
        branches (
          id,
          name,
          location,
          organization_id
        )
      `);

    // Non-super admins only see their own organization
    if (!context.isSuperAdmin) {
      query = query.eq("id", context.organizationId);
    }

    const { data, error } = await query.order("name");

    if (error) throw error;

    // The result will be an array of organizations,
    // each containing a 'branches' array.
    return data as Organizations[];
  } catch (error) {
    console.error("Error fetching organizations with branches:", error);
    return [];
  }
}

export async function createOrganizationAction(formData: {
  name: string;
  active: boolean;
}) {
  try {
    const context = await requireTenantContext();
    if (!context.isSuperAdmin) throw new Error("Forbidden: Super Admin only");

    const supabase = await createClient();
    const { error } = await supabase.from("organizations").insert({
      name: formData.name,
      active: formData.active,
    });

    if (error) throw error;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error creating organization:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function updateOrganizationAction(formData: {
  id: string;
  name: string;
  active: boolean;
}) {
  try {
    const context = await requireTenantContext();
    if (!context.isSuperAdmin && context.organizationId !== formData.id) {
      throw new Error("Forbidden");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("organizations")
      .update({
        name: formData.name,
        active: formData.active,
      })
      .eq("id", formData.id);

    if (error) throw error;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating organization:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export const deleteOrganizationAction = async (organizationId: string) => {
  try {
    const context = await requireTenantContext();
    if (!context.isSuperAdmin) throw new Error("Forbidden");

    const supabase = await createClient();
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", organizationId);

    if (error) throw error;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export const createBranchAction = async (formData: {
  name: string;
  location: string;
  organization_id: string;
}) => {
  try {
    const context = await requireTenantContext();

    // Ensure org_id is same as context for non-super admins
    const targetOrgId = context.isSuperAdmin
      ? formData.organization_id
      : context.organizationId;

    const supabase = await createClient();
    const { error } = await supabase.from("branches").insert({
      name: formData.name,
      location: formData.location,
      organization_id: targetOrgId,
    });

    if (error) throw error;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error creating branch:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export const updateBranchAction = async (formData: {
  id: string;
  name: string;
  location: string;
  organization_id: string;
}) => {
  try {
    const context = await requireTenantContext();
    const supabase = await createClient();

    // Verify branch belongs to org
    if (!context.isSuperAdmin) {
      const { data: branch } = await supabase
        .from("branches")
        .select("organization_id")
        .eq("id", formData.id)
        .single();
      if (branch?.organization_id !== context.organizationId)
        throw new Error("Forbidden");
    }

    const { error } = await supabase
      .from("branches")
      .update({
        name: formData.name,
        location: formData.location,
      }) // We don't allow changing organization_id of a branch for non-super admins
      .eq("id", formData.id);

    if (error) throw error;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating branch:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export const deleteBranchAction = async (branchId: string) => {
  try {
    const context = await requireTenantContext();
    const supabase = await createClient();

    if (!context.isSuperAdmin) {
      const { data: branch } = await supabase
        .from("branches")
        .select("organization_id")
        .eq("id", branchId)
        .single();
      if (branch?.organization_id !== context.organizationId)
        throw new Error("Forbidden");
    }

    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", branchId);

    if (error) throw error;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting branch:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};
