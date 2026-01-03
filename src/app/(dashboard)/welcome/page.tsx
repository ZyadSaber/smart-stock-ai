import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Building2, MapPin, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserProfile } from "@/types/user";
import { AccessDenied } from "@/components/access-denied";

export default async function WelcomePage() {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) redirect("/");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*, organizations(name), branches(name)")
        .eq("id", authUser.id)
        .single();

    if (!profile) {
        return (
            <AccessDenied
                title="You do not have access to this page"
                description="Go to Login"
                showHomeButton
            />
        );
    }

    const userProfile = profile as unknown as UserProfile;
    const welcomeMessage = "Welcome to your smart inventory hub. We've optimized your workspace to help you manage everything efficiently.";

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in duration-1000">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-2xl shadow-primary/5">
                        <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                </div>
                <h1 className="text-5xl font-black tracking-tighter sm:text-6xl bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-2">
                    SmartStock AI
                </h1>
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-2xl font-semibold text-foreground italic tracking-tight">
                        Hello, {userProfile.full_name || 'Valued User'}
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        {welcomeMessage}
                    </p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                <Card className="group relative overflow-hidden border-none shadow-xl shadow-black/5 bg-card/60 backdrop-blur-md transition-all hover:shadow-primary/5 hover:translate-y-[-2px]">
                    <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 transition-colors group-hover:bg-orange-500/20">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest leading-none">Organization</p>
                            <h3 className="text-xl font-bold text-foreground">{userProfile.organizations?.name || 'N/A'}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-none shadow-xl shadow-black/5 bg-card/60 backdrop-blur-md transition-all hover:shadow-primary/5 hover:translate-y-[-2px]">
                    <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-500/20">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest leading-none">Branch</p>
                            <h3 className="text-xl font-bold text-foreground">{userProfile.branches?.name || 'N/A'}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Action */}
            <div className="pt-4 flex flex-col items-center gap-4">
                <Button asChild size="lg" className="rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95">
                    <Link href={`/${userProfile.default_page || ""}`} className="flex items-center gap-2">
                        Go to Work
                        <LogIn className="h-4 w-4" />
                    </Link>
                </Button>
                <p className="text-sm text-muted-foreground/60 italic">
                    Start exploring your inventory insights
                </p>
            </div>

            {/* Footer Branding Area */}
            <div className="absolute bottom-8 text-sm text-muted-foreground tracking-widest opacity-30 select-none hidden md:block uppercase">
                Empowering Smart Commerce
            </div>
        </div>
    );
}
