"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/hooks/use-toast";
import { createUser, account } from "@/lib/appwrite";
import { useRouter } from "next/navigation";

const calculatePasswordStrength = (password) => {
  const lengthScore = Math.min(password.length * 5, 25);
  const varietyScore =
    (/[a-z]/.test(password) ? 15 : 0) +
    (/[A-Z]/.test(password) ? 15 : 0) +
    (/[0-9]/.test(password) ? 15 : 0) +
    (/[^a-zA-Z0-9]/.test(password) ? 15 : 0);
  return Math.min(lengthScore + varietyScore, 100);
};

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
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
      if (!name || !email || !password) {
        throw new Error("All fields are required.");
      }

      if (!agreeToTerms) {
        throw new Error("You must agree to the terms and conditions.");
      }

      const newUser = await createUser(email, password, name);

      if (newUser) {
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

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-100">
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Sign Up</h2>
            <p className="mt-2 text-gray-600">Join us at GAD Nexus</p>
          </div>
          <form onSubmit={handleSignUp} className="mt-8 space-y-6">
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
              <Progress
                value={passwordStrength}
                className="mt-2"
                color={passwordStrength < 50 ? "red" : "green"}
              />
              <p
                className={`mt-1 text-sm ${
                  passwordStrength < 50 ? "text-red-500" : "text-green-500"
                }`}
              >
                Password strength: {passwordStrength}%
              </p>
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
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
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
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center bg-blue-600 p-8 text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to GAD Nexus</h1>
        <p className="text-xl mb-8">
          Your journey in Gender and Development starts here.
        </p>
        <img src="/logo/gad.png" alt="GAD Nexus Logo" className="w-32 h-32" />
      </div>
    </div>
  );
}
