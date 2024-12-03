"use client";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Progress } from "../../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserPlus,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Facebook,
  Twitter,
  MessageSquare,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createUser, getAllUsers } from "../../lib/appwrite";

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
  const [emailError, setEmailError] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@ascot\.edu\.ph$/;
    return re.test(String(email).toLowerCase());
  };

  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);
    if (!validateEmail(emailValue)) {
      setEmailError(
        "Please enter a valid email address ending with @ascot.edu.ph"
      );
    } else {
      setEmailError("");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("All fields are required.");
      return;
    }

    if (!validateEmail(email)) {
      toast.error(
        "Please enter a valid ASCOT email address ending in @ascot.edu.ph."
      );
      return;
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      toast.error(
        "Password must be at least 8 characters long and contain uppercase, lowercase, and numbers."
      );
      return;
    }

    if (!agreeToTerms) {
      toast.error("You must agree to the terms and conditions.");
      return;
    }

    setIsLoading(true);

    try {
      // Check if the user already exists
      const isDuplicate = await getAllUsers(email);
      if (isDuplicate) {
        toast.error("An account with this email already exists.");
        setIsLoading(false);
        return;
      }

      const newUser = await createUser(email, password, name);
      if (newUser) {
        toast.success("Account created successfully!");
        // Reset form fields
        setName("");
        setEmail("");
        setPassword("");
        setAgreeToTerms(false);
        setRememberDevice(false);
        setEmailError("");
        setPasswordStrength(0);
      }
    } catch (error) {
      console.error("Sign-up error:", error);
      toast.error("Unable to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-900 text-gray-100">
      {/* Right Column (now on the left) */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-1 flex-col items-center justify-center bg-gray-800 p-8"
      >
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-block rounded-full p-2 bg-gray-700"
            >
              <UserPlus size={48} className="text-blue-400" />
            </motion.div>
            <h2 className="mt-4 text-3xl font-extrabold">Create an Account</h2>
            <p className="mt-2 text-gray-400">
              Join GAD Nexus and make a difference
            </p>
          </div>
          <form onSubmit={handleSignUp} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-700 border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your Ascot email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className="bg-gray-700 border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    placeholder="Enter your Password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <Progress value={passwordStrength} className="mt-2" />
                <p className="text-sm text-gray-400 mt-1">
                  Password strength:{" "}
                  {passwordStrength < 33
                    ? "Weak"
                    : passwordStrength < 66
                    ? "Medium"
                    : "Strong"}
                </p>
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
                className="ml-2 block text-sm text-gray-300"
              >
                Remember this device
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="flex items-center">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked)}
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-300"
              >
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-blue-400 hover:underline">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-400 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
          </form>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Or sign up with
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <FcGoogle className="mr-2 h-4 w-4" /> Google
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <FaDiscord className="mr-2 h-4 w-4 text-blue-500" /> Discord
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <Facebook className="mr-2 h-4 w-4 text-blue-600" /> Facebook
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <Twitter className="mr-2 h-4 w-4 text-blue-400" /> Twitter
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Left Column (now on the right) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-1 flex-col items-center justify-center bg-gray-900 p-8"
      >
       <div className="w-full max-w-md">
        <h4 className="text-xl font-bold text-center text-yellow-200 mb-4">
          Aurora State College of Technology
        </h4>
        <h1 className="text-4xl font-bold text-center text-gray-200 mb-4">
Gender and Development         </h1>
        <div className="flex justify-center items-center space-x-4 mb-6">
          <img
            src="/logo/gad.png"
            alt="GAD Nexus Logo"
            width={270}
            height={270}
            className="object-contain"
          />
          <img
            src="/logo/ascot.png"
            alt="ASCOT Logo"
            width={270}
            height={270}
            className="object-contain"
          />
        </div>

          <h1 className="text-4xl font-extrabold text-center text-gray-100">
            Welcome to GAD Nexus
          </h1>
          <p className="mt-4 text-lg text-center text-gray-400">
            A gentle approach to Gender and Development Information System and
            Demographic Analysis.
          </p>
          <p className="mt-6 text-center text-gray-400">
            Already have an account?{" "}
            <Link href="/signin" className="text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
      <ToastContainer />
    </div>
  );
}
