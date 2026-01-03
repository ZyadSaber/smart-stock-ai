import { NavLinks } from "./nav-links"
import { NavUser } from "./nav-user"
import { createClient } from "@/utils/supabase/server"
import { SidebarContent } from "./sidebar-content"

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
        <SidebarContent
            defaultPage={data?.default_page}
            navLinks={<NavLinks userRole={data?.permissions || {}} />}
            navUser={<NavUser user={user} />}
        />
    )
}