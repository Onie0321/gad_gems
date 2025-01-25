"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { account, createNotification, getCurrentUser } from "@/lib/appwrite";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Include the email in the recovery URL
      const recoveryUrl = `${
        window.location.origin
      }/reset-password?email=${encodeURIComponent(email)}`;
      await account.createRecovery(email, recoveryUrl);

      // Create notification for admin
      await createNotification({
        userId: "admin",
        type: "account",
        title: "Password Reset Request",
        message: `A password reset was requested for email: ${email}`,
        actionType: "password_reset_request",
        status: "info",
        read: false,
      });

      setMessage("Recovery email sent. Please check your inbox.");
      toast({
        title: "Recovery Email Sent",
        description: "Please check your inbox for password reset instructions.",
        variant: "success",
      });
      setEmail("");
    } catch (error) {
      console.error("Password recovery error:", error);
      toast({
        title: "Error",
        description:
          "Failed to send recovery email. Please check your email and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F5] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-[#37474F]">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you password reset
            instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#2D89EF] hover:bg-[#2679D5] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Instructions"}
            </Button>
            {message && (
              <p className="text-center text-sm text-[#37474F]">{message}</p>
            )}
            <div className="text-center">
              <Link
                href="/sign-in"
                className="text-[#FF6F61] hover:text-[#E5635B]"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
