"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, db, COLLECTIONS, doc, getDoc, setDoc, query, collection, where, getDocs } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        console.log("User authenticated:", user);

        // Check if user exists in the users collection
        const userExists = await checkUserInDatabase(user.uid);

        if (!userExists) {
          // If user doesn't exist, create a new document in the users collection
          await createUserInDatabase(user);
          toast({
            title: "Success",
            description: "Account created successfully!",
          });
        } else {
          toast({
            title: "Success",
            description: "Signed in successfully!",
          });
        }

        // Redirect based on user role
        const userDoc = await getUserFromDatabase(user.uid);
        if (userDoc) {
          switch (userDoc.role) {
            case "admin":
              router.push("/admin");
              break;
            case "user":
              router.push("/officer");
              break;
            default:
              toast({
                title: "Error",
                description: "Unknown user role",
                variant: "destructive",
              });
              router.push("/sign-in");
              break;
          }
        } else {
          router.push("/sign-in");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        toast({
          title: "Error",
          description: "Authentication failed. Please try again.",
          variant: "destructive",
        });
        router.push("/sign-in");
      }
    };

    checkUser();
  }, [router, toast]);

  const checkUserInDatabase = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      return userDoc.exists();
    } catch (error) {
      console.error("Error checking user in database:", error);
      return false;
    }
  };

  const createUserInDatabase = async (user) => {
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        name: user.displayName || user.email,
        email: user.email,
        role: "user", // Default role
        accountId: user.uid,
        approvalStatus: "pending", // Default approval status
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating user in database:", error);
      throw error;
    }
  };

  const getUserFromDatabase = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user from database:", error);
      return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-gradient-x">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 border-t-4 border-b-4 border-white rounded-full animate-spin mx-auto"></div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 animate-pulse">
          Authenticating
        </h1>
        <p className="text-xl text-white opacity-75">
          Please wait while we secure your connection...
        </p>
      </div>
    </div>
  );
}