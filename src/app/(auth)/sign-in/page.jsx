"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentUser,
  account,
  SignIn,
  createGoogleUser,
  logActivity,
  createNotification,
} from "@/lib/appwrite";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";

const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
);

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirected, setIsRedirected] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { loading } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    const checkSession = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.role !== "guest" && !isRedirected) {
          handleUserStatus(user);
          setIsRedirected(true);
        }
      } catch (error) {
        console.error("Error checking existing session:", error);
      }
    };
    checkSession();
  }, [isRedirected]);

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
      // Note: Activity logging will happen in the auth-callback page
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First create the session
      const userAccount = await SignIn(email, password);

      // Get user details after session is created
      const user = await getCurrentUser();

      if (!user) {
        throw new Error("Failed to get user details");
      }

      // Log the sign-in activity
      await logActivity(user.$id, "email_signin");

      // Handle navigation based on user role and approval status
      if (user.approvalStatus === "approved") {
        toast({
          title: "Welcome Back!",
          description: `You've successfully signed in, ${user.name}.`,
          variant: "success",
        });

        // Use router.push instead of window.location for smoother navigation
        router.push(user.role === "admin" ? "/admin" : "/officer");
      } else {
        toast({
          title: "Access Denied",
          description:
            "Your account needs approval. Please wait for admin confirmation.",
          variant: "destructive",
        });
        await account.deleteSession("current"); // Log out if not approved
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return null; // Let the layout handle loading state
  }

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#F5F5F5]">
      <MotionDiv
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
        className="flex flex-1 flex-col items-center justify-center bg-[#F9A825] p-8"
      >
        <Card className="w-full max-w-md shadow-lg bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-[#37474F]">
              Welcome to GAD Nexus
            </CardTitle>
            <CardDescription className="text-xl text-center text-[#37474F] mt-2">
              Access your Gender and Development Information System
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="flex items-center justify-center space-x-4">
              <img
                src="/logo/gad.png"
                alt="GAD Nexus Logo"
                className="w-32 h-32"
              />
              <img
                src="/logo/ascot.png"
                alt="ASCOT Logo"
                className="w-32 h-32"
              />
            </div>
          </CardContent>
        </Card>
      </MotionDiv>
      <MotionDiv
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
        className="flex flex-1 flex-col items-center justify-center p-8"
      >
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-[#37474F]">
              Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Welcome back to GAD Nexus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="mt-4 text-center text-sm text-gray-600">
                Forgot your password?{" "}
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#FF6F61] hover:text-[#E5635B]"
                >
                  Reset it here
                </Link>
              </p>
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
                className="w-full bg-[#2D89EF] hover:bg-[#2679D5] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6">
              <Button
                type="button"
                className="w-full bg-[#4DB6AC] hover:bg-[#45A399] text-white"
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
                className="font-medium text-[#FF6F61] hover:text-[#E5635B]"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </MotionDiv>
    </div>
  );
}
