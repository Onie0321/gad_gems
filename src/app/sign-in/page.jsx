"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserCircle,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Facebook,
  Twitter,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { signIn, getCurrentUser, getAllSessions, deleteSession, deleteAllSessionsExceptCurrent } from "../../lib/appwrite";

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [existingSessions, setExistingSessions] = useState([])

  useEffect(() => {
    async function fetchSessions() {
      try {
        const activeSessions = await getAllSessions();
        setSessions(activeSessions.sessions);
      } catch (error) {
        console.error("Error fetching sessions:", error.message);
        toast.error("Unable to fetch sessions. Please try again.");
      }
    }
  
    fetchSessions();
  }, []);

  useEffect(() => {
    checkExistingSessions()
  }, [])

  const checkExistingSessions = async () => {
    try {
      const { sessions } = await getAllSessions()
      setExistingSessions(sessions)
    } catch (error) {
      console.error("Error fetching sessions:", error)
      toast.error("Failed to fetch active sessions. Please try again.")
    }
  }
  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (existingSessions.length > 0) {
        // Show confirmation dialog for existing sessions
        const confirmNewSession = window.confirm(
          "You have existing active sessions. Do you want to create a new session?"
        )
        if (!confirmNewSession) {
          setIsLoading(false)
          return
        }
      }

        // Attempt to sign in and create a new session
        const session = await signIn(email, password)
        const user = await getCurrentUser()

      toast.success("Sign-in successful!");
      setEmail("");
      setPassword("");

      if (user) {
        console.log("User object:", user); 

       
        switch (user.role) {
          case "admin":
            router.push("/admin"); 
            break;
          case "user":
            router.push("/officer"); 
            break;
          default:
            toast.error("Error: Unknown user role");
            break;
        }
      }
    } catch (error) {
      toast.error(error.message || "Sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await deleteSession(sessionId)
      toast.success("Session ended successfully")
      checkExistingSessions() // Refresh the sessions list
    } catch (error) {
      toast.error("Failed to end session. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-900 text-gray-270">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-1 flex-col items-center justify-center p-8"
      >
       <div className="w-full max-w-md">
        <h4 className="text-2xl font-bold text-center text-yellow-200 mb-4">
          Aurora State College of Technology
        </h4>
        <h1 className="text-4xl font-bold text-center text-white mb-4">
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
        <h1 className="text-4xl font-extrabold text-white text-center">
          Welcome to GAD Nexus
        </h1>
        <p className="mt-4 text-lg text-center text-gray-400">
          Access your Gender and Development Information System
        </p>
      </div>
      </motion.div>
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
              <UserCircle size={48} className="text-blue-400" />
            </motion.div>
            <h2 className="mt-4 text-3xl text-white font-extrabold">Sign In</h2>
            <p className="mt-2 text-gray-400">Access your GAD Nexus account</p>
          </div>
          <form onSubmit={handleSignIn} className="mt-8 space-y-6">
            <div className="space-y-4 text-white">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative ' " >
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your Ascot email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-700 border-gray-600 focus:ring-blue-500 focus:border-blue-500 pl-10"
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
                    required
                    placeholder="Enter your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 focus:ring-blue-500 focus:border-blue-500 pl-10 pr-10"
                  />
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-270"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id="remember"
                  checked={rememberDevice}
                  onCheckedChange={(checked) => setRememberDevice(checked)}
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-white"
                >
                  Remember this device
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-400 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          {existingSessions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Active Sessions</h3>
              <ul className="space-y-2">
                {existingSessions.map((session) => (
                  <li key={session.$id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      {new Date(session.$createdAt).toLocaleString()}
                    </span>
                    <Button
                      onClick={() => handleEndSession(session.$id)}
                      variant="destructive"
                      size="sm"
                    >
                      End Session
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Or sign in with
                </span>
              </div>
            </div>
            <div className="mt-6 text-white grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 transition-colors border-2 border-red-500"
              >
                <FcGoogle className="mr-2 h-4 w-4" /> Google
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 transition-colors border-2 border-blue-500"
              >
                <FaDiscord className="mr-2 h-4 w-4 text-blue-500" /> Discord
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 transition-colors border-2 border-blue-600"
              >
                <Facebook className="mr-2 h-4 w-4 text-blue-600" /> Facebook
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 transition-colors border-2 border-blue-400"
              >
                <Twitter className="mr-2 h-4 w-4 text-blue-400" /> Twitter
              </Button>
            </div>
          </div>
          <p className="mt-6 text-center text-gray-400">
            Don't have an account?{" "}
            <Link
              href="/signin/signup"
              className="text-blue-400 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
      <ToastContainer />
    </div>
  );
}
