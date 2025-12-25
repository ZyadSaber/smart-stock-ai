"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Box } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { login } from "./actions"

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await login(formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Welcome back! Redirecting...")
        router.push(`/${result?.default_page}`)
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <Box className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">SmartStock AI</CardTitle>
          <CardDescription>Enter your credentials to manage your inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@smartstock.ai"
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                disabled={isPending}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11 text-lg font-semibold" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}