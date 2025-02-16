import { account, client } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useToast } from "@/hooks/use-toast";

const getGoogleAccessToken = async () => {
  try {
    const currentUrl = window.location.origin;
    const session = await account.createOAuth2Session(
      "google",
      `${currentUrl}/auth-callback`,
      currentUrl,
      ["email", "profile"]
    );
    return session?.accessToken;
  } catch (error) {
    console.error("Error getting Google access token:", error);
    return null;
  }
};

export const verifyGoogleEmail = async (email, password, name) => {
  try {
    console.log("Starting verification process for:", email);

    // First create a temporary account
    console.log("Creating temporary account...");
    const tempAccount = await account.create(
      ID.unique(),
      email,
      password,
      name
    );
    console.log("Account created successfully:", tempAccount);

    // Create a session using email/password login
    console.log("Creating session...");
    const session = await account.createSession(email, password);
    console.log("Session created successfully:", session);

    // Then send verification email
    console.log("Sending verification email...");
    const verificationResponse = await account.createVerification(
      `${window.location.origin}/verify-email`
    );
    console.log("Verification email sent:", verificationResponse);

    // Log the URL we're redirecting to
    const redirectUrl = "/verify-email";
    console.log("Redirecting to:", redirectUrl);

    // Use window.location for navigation
    window.location.href = redirectUrl;

    return true;
  } catch (error) {
    console.error("Detailed error in verification process:", {
      error,
      code: error.code,
      message: error.message,
      type: error.type,
    });

    // Handle specific error cases
    if (error.code === 409) {
      console.log("Account already exists error");
      throw new Error("This email is already registered");
    }

    // Log any cleanup attempts
    if (error.code === 401) {
      console.log("Authorization error, attempting cleanup...");
      try {
        // Try to delete the account if it was created
        await account.deleteSessions();
        await account.delete();
        console.log("Account cleanup successful");
      } catch (deleteError) {
        console.error("Cleanup failed:", deleteError);
      }
      throw new Error("Account creation failed. Please try again.");
    }

    throw new Error("Failed to send verification email. Please try again.");
  }
};

export const isGoogleEmail = (email) => {
  const googleDomains = ["@gmail.com", "@googlemail.com"];
  return googleDomains.some((domain) => email.toLowerCase().endsWith(domain));
};
