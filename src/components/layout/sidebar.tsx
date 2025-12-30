import { NavLinks } from "./nav-links"
import { NavUser } from "./nav-user"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"

export async function Sidebar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from('profiles')
        .select("permissions, default_page")
        .eq('id', user.id)
        .single()


    return (
        <aside className="w-64 border-r bg-card h-screen flex flex-col transition-colors">
            <div className="p-6">
                <Link href={`/${data?.default_page}`} className="text-xl font-bold tracking-tight text-primary">SmartStock AI</Link>
            </div>

            <nav className="flex-1 px-3 overflow-y-auto">
                <NavLinks userRole={data?.permissions || {}} />
            </nav>

            <div className="p-4 border-t">
                <NavUser user={user} />
            </div>
        </aside>
    )
}