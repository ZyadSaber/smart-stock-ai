import { getUsers, getOrganizationsWithBranches } from "./actions";
import { UsersTable } from "@/components/users/UsersTable";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { OrganizationTable } from "@/components/users/OrganizationTable";
import { AddOrganizationDialog } from "@/components/users/AddOrganizationDialog";

export default async function UsersPage() {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) redirect("/login");

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', authUser.id)
        .single();

    if (!profile?.is_super_admin) {
        console.warn(`Unauthorized access attempt to Users page by user: ${authUser.id}`);
        return (
            <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
                <ShieldAlert className="h-16 w-16 text-destructive opacity-50" />
                <h2 className="text-2xl font-bold italic tracking-tight">Access Denied</h2>
                <p className="text-muted-foreground">Only system administrators can manage users and permissions.</p>
            </div>
        );
    }

    const users = await getUsers();
    const orgazniations = await getOrganizationsWithBranches();

    console.log(orgazniations)

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        System Users Management
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage system access, roles, and granular permissions for your team.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-black/5 overflow-hidden p-0 gap-0">
                <CardHeader className="bg-muted/30 pb-4 pt-4">
                    <CardTitle className="text-xl font-semibold">User Directory</CardTitle>
                    <CardDescription className="flex justify-between gap-2">
                        A comprehensive list of all staff members with system access.
                        <AddUserDialog />
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <UsersTable users={users} />
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-black/5 overflow-hidden p-0 gap-0">
                <CardHeader className="bg-muted/30 pb-4 pt-4">
                    <CardTitle className="text-xl font-semibold">Organization Directory</CardTitle>
                    <CardDescription className="flex items-center justify-between gap-2">
                        A comprehensive list of all organizations.
                        <AddOrganizationDialog />
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <OrganizationTable orgazniations={orgazniations} />
                </CardContent>
            </Card>
        </div>
    );
}
