"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentUser,
  account,
  SignIn,
  createGoogleUser,
} from "@/lib/appwrite";

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirected, setIsRedirected] = useState(false); // New state to track redirection

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.role !== "guest" && !isRedirected) {
          handleUserStatus(user);
          setIsRedirected(true); // Set to true after redirecting
        }
      } catch (error) {
        console.error("Error checking existing session:", error);
      }
    };
    checkSession();
  }, [isRedirected]); // Add isRedirected to the dependency array

  const handleUserStatus = (user) => {
    switch (user.approvalStatus) {
      case "pending":
        toast({
          title: "Account Pending",
          description:
            "Your account is pending approval. Please wait for admin confirmation.",
          variant: "warning",
        });
        break;
      case "approved":
        toast({
          title: "Welcome Back!",
          description: `You've successfully signed in, ${user.name}.`,
          variant: "success",
        });
        router.push(user.role === "admin" ? "/admin" : "/officer");
        break;
      case "declined":
        toast({
          title: "Account Declined",
          description:
            "Your account has been declined. Please contact the administrator.",
          variant: "destructive",
        });
        break;
      default:
        toast({
          title: "Unknown Status",
          description:
            "There was an issue with your account status. Please contact support.",
          variant: "destructive",
        });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const currentUrl = window.location.origin;
      await account.createOAuth2Session(
        "google",
        `${currentUrl}/auth-callback`,
        `${currentUrl}/sign-in`
      );
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const session = await SignIn(email, password);
      if (session) {
        const user = await getCurrentUser();
        if (user) {
          handleUserStatus(user);
        } else {
          throw new Error("Failed to fetch user data after sign-in.");
        }
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      toast({
        title: "Error",
        description: error.message || "Sign-in failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-100">
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
            <p className="mt-2 text-gray-600">Welcome back to GAD Nexus</p>
          </div>
          <form onSubmit={handleSignIn} className="mt-8 space-y-6">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="remember"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked)}
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember this device
              </label>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center bg-blue-600 p-8 text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to GAD Nexus</h1>
        <p className="text-xl mb-8">
          Access your Gender and Development Information System
        </p>
        <img src="/logo/gad.png" alt="GAD Nexus Logo" className="w-32 h-32" />
      </div>
    </div>
  );
}
