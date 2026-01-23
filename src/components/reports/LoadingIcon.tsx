import { Loader2 } from "lucide-react"

const LoadingIcon = () => (
    <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
    </div>
)

export default LoadingIcon
