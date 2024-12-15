'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from '@/hooks/use-toast'
import { useAppwrite } from '@/hooks/useAppwrite'

const formSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { validateResetToken, resetPassword } = useAppwrite()

  const userId = searchParams.get('userId')
  const token = searchParams.get('token')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    const checkToken = async () => {
      if (userId && token) {
        try {
          const isValid = await validateResetToken(userId, token)
          setIsTokenValid(isValid)
          if (!isValid) {
            toast({
              title: "Invalid or expired token",
              description: "Please request a new password reset link.",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('Error validating token:', error)
          toast({
            title: "Error",
            description: "An error occurred while validating your reset token.",
            variant: "destructive",
          })
        }
      } else {
        setIsTokenValid(false)
        toast({
          title: "Missing information",
          description: "The password reset link is invalid.",
          variant: "destructive",
        })
      }
    }

    checkToken()
  }, [userId, token, toast, validateResetToken])

  async function onSubmit(values) {
    if (!userId || !token) return

    setIsLoading(true)
    try {
      await resetPassword(userId, token, values.password)
      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password.",
      })
      // Redirect to login page or show a success message
    } catch (error) {
      console.error('Error resetting password:', error)
      toast({
        title: "Error",
        description: "An error occurred while resetting your password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isTokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
          <p>The password reset link is invalid or has expired. Please request a new one.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Reset Your Password</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

