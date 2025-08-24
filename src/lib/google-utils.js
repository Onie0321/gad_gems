import { auth, addDoc, collection, db, COLLECTIONS } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const getGoogleAccessToken = async () => {
  try {
    // Only run on client side
    if (typeof window === 'undefined') {
      return null;
    }
    
    const currentUrl = window.location.origin;
    // Note: Firebase handles OAuth differently than Appwrite
    // This function would need to be implemented differently for Firebase
    console.warn('Google OAuth2 session creation not implemented for Firebase yet');
    return null;
  } catch (error) {
    console.error("Error getting Google access token:", error);
    return null;
  }
};

export const verifyGoogleEmail = async (email, password, name) => {
  try {
    console.log("Starting verification process for:", email);

    // Only run on client side
    if (typeof window === 'undefined') {
      throw new Error("This function can only be called on the client side");
    }

    // Note: This function needs to be reimplemented for Firebase
    // Firebase handles email verification differently than Appwrite
    console.warn('Email verification not implemented for Firebase yet');
    
    // For now, just redirect to verify-email page
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
    if (error.code === 'auth/email-already-in-use') {
      console.log("Account already exists error");
      throw new Error("This email is already registered");
    }

    throw new Error("Failed to send verification email. Please try again.");
  }
};

export const isGoogleEmail = (email) => {
  const googleDomains = ["@gmail.com", "@googlemail.com"];
  return googleDomains.some((domain) => email.toLowerCase().endsWith(domain));
};
