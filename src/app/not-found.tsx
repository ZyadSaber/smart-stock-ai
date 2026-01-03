import { AccessDenied } from "@/components/access-denied";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <AccessDenied
                title="404 - Page Not Found"
                description="The page you are looking for does not exist, or you don't have the required permissions to access it."
                showHomeButton
            />
        </div>
    );
}
