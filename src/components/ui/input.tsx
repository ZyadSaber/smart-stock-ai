import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label";

type InputProps = React.ComponentProps<"input"> & {
  error?: string
  label?: string
  containerClassName?: string
}

function Input({ className, type, error, name, label, containerClassName, ...props }: InputProps) {
  return (
    <div className={cn("space-y-2 px-1", containerClassName)}>
      {!!label && <Label htmlFor={name} className={cn("text-sm font-medium", error && "text-destructive")} >{label}</Label>}
      <input
        type={type}
        data-slot="input"
        name={name}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          !!error && "border-destructive",
          className
        )}
        {...props}
      />
      {!!error && <p className="text-destructive text-sm px-3 ">{error}</p>}
    </div>
  )
}

export { Input }
