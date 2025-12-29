import LoadingOverlay from "@/components/layout/loading-overlay";

export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <LoadingOverlay />
        </div>
    );
}
