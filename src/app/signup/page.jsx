"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/hooks/use-toast";
import { createUser, account, createNotification } from "@/lib/appwrite";
import dynamic from "next/dynamic";

const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
);

const calculatePasswordStrength = (password) => {
  let score = 0;
  if (password.length > 6) score += 20;
  if (password.length > 10) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  return Math.min(score, 100);
};

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  const handleGoogleSignUp = async () => {
    try {
      const currentUrl = window.location.origin;
      await account.createOAuth2Session(
        "google",
        `${currentUrl}/auth-callback`,
        `${currentUrl}/signup`
      );

       // If successful, create notifications
    if (session) {
      const userDetails = await account.get();
      
      // Create notification for admin
      await createNotification({
        userId: "admin",
        type: "account",
        title: "New Google Account Registration",
        message: `New user ${userDetails.name} has registered via Google.`,
        actionType: "user_registration",
        read: false,
        timestamp: new Date().toISOString()
      });

      // Create welcome notification for the new user
      await createNotification({
        userId: userDetails.$id,
        type: "info",
        title: "Welcome to GAD Nexus",
        message: `Welcome ${userDetails.name}! Your Google account has been connected successfully.`,
        read: false,
        timestamp: new Date().toISOString()
      });
    }
    } catch (error) {
      console.error("Google signup error:", error);
      toast({
        title: "Error",
        description: "Failed to sign up with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!name || !email || !password || !confirmPassword) {
        throw new Error("All fields are required.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      if (!agreeToTerms) {
        throw new Error("You must agree to the terms and conditions.");
      }

      const newUser = await createUser(email, password, name);

      if (newUser) {
         // Create notification for admin
      await createNotification({
        userId: "admin",
        type: "account",
        title: "New User Registration",
        message: `New user ${name} (${email}) has registered and requires approval.`,
        actionType: "user_registration",
        read: false,
        timestamp: new Date().toISOString()
      });
      // Create welcome notification for the new user
      await createNotification({
        userId: newUser.$id,
        type: "info",
        title: "Welcome to GAD Nexus",
        message: `Welcome ${name}! Your account has been created successfully.`,
        read: false,
        timestamp: new Date().toISOString()
      });
        toast({
          title: "Success",
          description: "Account created successfully!",
          variant: "success",
        });
        router.push("/sign-in");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <>
      <style jsx global>{`
        .mt-2[role="progressbar"] {
          background-color: #000000;
        }
        .mt-2[role="progressbar"] > div {
          background-color: var(--progress-color);
          transition: width 0.3s ease-in-out, background-color 0.3s ease-in-out;
        }
      `}</style>
      <div className="flex min-h-screen flex-col md:flex-row bg-[#F5F5F5]">
        <MotionDiv
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
          className="flex flex-1 flex-col items-center justify-center p-8"
        >
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-[#37474F]">
                Sign Up
              </CardTitle>
              <CardDescription className="text-center">
                Join us at GAD Nexus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-6">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                    />
                    <User
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>
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
                      placeholder="Create a strong password"
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
                  {password && (
                    <>
                      <Progress
                        value={passwordStrength}
                        className="mt-2"
                        style={{
                          "--progress-color":
                            passwordStrength < 33
                              ? "#FF6F61"
                              : passwordStrength < 66
                              ? "#FFA500"
                              : "#4CAF50",
                        }}
                      />
                      <p className="mt-1 text-sm text-black">
                        Password strength:{" "}
                        {passwordStrength < 33
                          ? "Weak"
                          : passwordStrength < 66
                          ? "Medium"
                          : "Strong"}
                      </p>
                    </>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <Lock
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked)}
                  />
                  <label
                    htmlFor="terms"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-[#FF6F61] hover:text-[#E5635B]"
                    >
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/signup/privacy-policy"
                      className="text-[#FF6F61] hover:text-[#E5635B]"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#2D89EF] hover:bg-[#2679D5] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing Up..." : "Sign Up"}
                </Button>
              </form>
              <div className="mt-6">
                <Button
                  type="button"
                  className="w-full bg-[#4DB6AC] hover:bg-[#45A399] text-white"
                  onClick={handleGoogleSignUp}
                >
                  <FcGoogle className="mr-2 h-4 w-4" />
                  Sign up with Google
                </Button>
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-[#FF6F61] hover:text-[#E5635B]"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </MotionDiv>
        <MotionDiv
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
          className="flex flex-1 flex-col items-center justify-center bg-[#F9A825] p-8"
        >
          <Card className="w-full max-w-md shadow-lg bg-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-[#37474F]">
                Welcome to GAD Nexus
              </CardTitle>
              <CardDescription className="text-xl text-center text-[#37474F] mt-2">
                Your journey in Gender and Development starts here.
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
      </div>
    </>
  );
}
