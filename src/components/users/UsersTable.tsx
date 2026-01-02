"use client";

import { useState } from "react";
import { UserProfile, UsersTableProps } from "@/types/user";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCog } from "lucide-react";
import { EditPermissionsDrawer } from "./EditPermissionsDrawer";



export function UsersTable({ users, organizationsList, branchesList }: UsersTableProps) {
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleEditPermissions = (user: UserProfile) => {
        setSelectedUser(user);
        setDrawerOpen(true);
    };

    return (
        <div className="rounded-md border bg-card/60 backdrop-blur-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-[200px]">User Account</TableHead>
                        <TableHead className="w-[600px]">Permissions Summary</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right pr-6">Manage</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                No users found in the system.
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-primary/10">
                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm leading-tight">{user.full_name || 'Anonymous User'}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1.5 max-w-[600px]">
                                        {
                                            Object.entries(user.permissions).map(([key]) => (
                                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-secondary/50 border-none font-normal" key={key}>{key}</Badge>
                                            ))
                                        }
                                    </div>
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                    {user.organizations?.name}
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                    {user.branches?.name}
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                    {new Date(user.updated_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditPermissions(user)}
                                        className="h-8 gap-1.5 hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                                    >
                                        <UserCog className="h-3.5 w-3.5" />
                                        <span className="text-[11px]">Manage</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <EditPermissionsDrawer
                key={selectedUser?.id}
                user={selectedUser}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                organizationsList={organizationsList}
                branchesList={branchesList}
            />
        </div>
    );
}
