"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { UserProfile, UserPermissions, Orgazniations } from "@/types/user";

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

async function ensureAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    throw new Error("Forbidden: Admin access required");
  }
}

export async function getUsers(): Promise<UserProfile[]> {
  try {
    await ensureAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    if (error) throw error;
    return data as UserProfile[];
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
    await ensureAdmin();
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

    // 2. Link to profiles (handled by trigger usually, but let's be explicit if needed)
    // In our schema, profiles has id as FK to auth.users.id
    // Trigger might exist but let's update it to ensure role/name are set
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: authData.user.id,
      full_name: formData.full_name,
      is_super_admin: false,
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
  permissions: UserPermissions
) {
  try {
    await ensureAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ permissions })
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
    await ensureAdmin();
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
    await ensureAdmin();
    const adminClient = createAdminClient();

    // 1. Delete user from Supabase Auth (this cascades to profiles in our schema)
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
    await ensureAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("organizations")
      .select(
        `
        *,
        branches (
          id,
          name,
          location,
          organization_id
        )
      `
      )
      .order("name");

    if (error) throw error;

    // The result will be an array of organizations,
    // each containing a 'branches' array.
    return data as Orgazniations[];
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
    await ensureAdmin();
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
    await ensureAdmin();
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
    await ensureAdmin();
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
    await ensureAdmin();
    const supabase = await createClient();

    const { error } = await supabase.from("branches").insert({
      name: formData.name,
      location: formData.location,
      organization_id: formData.organization_id,
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
    await ensureAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("branches")
      .update({
        name: formData.name,
        location: formData.location,
        organization_id: formData.organization_id,
      })
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
    await ensureAdmin();
    const supabase = await createClient();

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
