"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { account } from "@/lib/appwrite";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get URL parameters and decode email
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");
  const email = searchParams.get("email")
    ? decodeURIComponent(searchParams.get("email"))
    : null;

  // Add useEffect to check parameters
  useEffect(() => {
    if (!userId || !secret || !email) {
      toast({
        title: "Invalid Reset Link",
        description:
          "This password reset link appears to be invalid or expired. Please request a new one.",
        variant: "destructive",
      });
    }
  }, [userId, secret, email, toast]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!userId || !secret) {
      toast({
        title: "Error",
        description: "Invalid reset link. Please request a new password reset.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await account.updateRecovery(userId, secret, password, confirmPassword);

      toast({
        title: "Success",
        description: "Password reset successful. You can now log in with your new password.",
        variant: "success",
      });

      router.push("/sign-in");
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
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
            Reset Password
          </CardTitle>
          {email ? (
            <CardDescription className="text-center text-base">
              Resetting password for:{" "}
              <strong className="text-[#2D89EF]">{email}</strong>
            </CardDescription>
          ) : (
            <CardDescription className="text-center text-base text-red-500">
              Invalid reset link. Please request a new password reset.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#2D89EF] hover:bg-[#2679D5] text-white"
              disabled={isLoading || !userId || !secret || !email}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
            {(!userId || !secret || !email) && (
              <p className="text-center text-sm text-red-500">
                This reset link is invalid or expired. Please{" "}
                <Link
                  href="/forgot-password"
                  className="text-[#2D89EF] hover:underline"
                >
                  request a new one
                </Link>
                .
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
