import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label";

type InputProps = React.ComponentProps<"textarea"> & {
  error?: string
  label?: string
  containerClassName?: string
}

function Textarea({ className, error, name, label, containerClassName, ...props }: InputProps) {
  return (
    <div className={cn("space-y-2 px-1", containerClassName)}>
      {!!label && <Label htmlFor={name} className={cn("text-sm font-medium", error && "text-destructive")} >{label}</Label>}
      <textarea
        data-slot="textarea"
        name={name}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          !!error && "border-destructive",
          className
        )}
        {...props}
      />
      {!!error && <p className="text-destructive text-sm px-3 ">{error}</p>}
    </div>
  )
}

export { Textarea }
