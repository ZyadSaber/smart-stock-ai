import { getUsers } from "./actions";
import { UsersTable } from "@/components/users/UsersTable";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default async function UsersPage() {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) redirect("/login");

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

    if (profile?.role !== 'admin') {
        console.warn(`Unauthorized access attempt to Users page by user: ${authUser.id}`);
        return (
            <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
                <ShieldAlert className="h-16 w-16 text-destructive opacity-50" />
                <h2 className="text-2xl font-bold italic tracking-tight">Access Denied</h2>
                <p className="text-muted-foreground">Only system administrators can manage users and permissions.</p>
            </div>
        );
    }

    console.log("Fetching users list for Team Management page...");
    const users = await getUsers();
    console.log(`Successfully fetched ${users.length} users.`);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Team Management
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage system access, roles, and granular permissions for your team.
                    </p>
                </div>
                <AddUserDialog />
            </div>

            <Card className="border-none shadow-xl shadow-black/5 overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-xl font-semibold">User Directory</CardTitle>
                    <CardDescription>
                        A comprehensive list of all staff members with system access.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <UsersTable users={users} />
                </CardContent>
            </Card>
        </div>
    );
}
