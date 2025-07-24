"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Client, Account, Databases } from "appwrite";
import { useToast } from "@/hooks/use-toast";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

export default function AuthCallback() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let completed = false; // Track if a success path was taken

    const checkUser = async () => {
      try {
        const user = await account.get();
        console.log("User authenticated:", user);

        // Check if user exists in the users collection
        const userExists = await checkUserInDatabase(user.$id);

        if (!userExists) {
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

        // Redirect based on user role and approval status
        const userDoc = await getUserFromDatabase(user.$id);
        completed = true; // Mark as completed before navigation

        if (userDoc) {
          if (userDoc.approvalStatus === "approved") {
            toast({
              title: "Success",
              description: "Signed in successfully!",
            });
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
            toast({
              title: "Account Pending Approval",
              description:
                "Your account is pending admin approval. Please wait for confirmation before signing in.",
              variant: "warning",
            });
            // Optionally redirect to sign-in or a pending page
            router.push("/sign-in");
          }
        } else {
          router.push("/sign-in");
        }
      } catch (error) {
        if (!completed) {
          // Only show error if not already successful
          console.error("Authentication error:", error);
          toast({
            title: "Error",
            description: "Authentication failed. Please try again.",
            variant: "destructive",
          });
          router.push("/sign-in");
        }
      }
    };

    checkUser();
  }, [router, toast]);

  const checkUserInDatabase = async (userId) => {
    try {
      await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
        userId
      );
      return true;
    } catch (error) {
      if (error.code === 404) {
        return false;
      }
      throw error;
    }
  };

  const createUserInDatabase = async (user) => {
    // Check if the document already exists before creating
    try {
      await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
        user.$id
      );
      // If no error, document exists, do nothing
      return;
    } catch (error) {
      if (error.code !== 404) {
        // If error is not 'not found', rethrow
        throw error;
      }
      // If 404, proceed to create
    }
    try {
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
        user.$id,
        {
          name: user.name,
          email: user.email,
          role: "user", // Default role
          accountId: user.$id,
          approvalStatus: "pending", // Default approval status
        }
      );
    } catch (error) {
      // If error is 409 (already exists), ignore it
      if (error.code === 409) return;
      console.error("Error creating user in database:", error);
      throw error;
    }
  };

  const getUserFromDatabase = async (userId) => {
    try {
      return await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
        userId
      );
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
