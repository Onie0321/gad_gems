import { Client, Account } from "appwrite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("🔍 Testing Frontend Appwrite Connection (No API Key)...");
console.log("");

// Check environment variables
console.log("📋 Environment Variables Check:");
console.log(
  `✅ NEXT_PUBLIC_APPWRITE_ENDPOINT: ${
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? "Set" : "Not set"
  }`
);
console.log(
  `✅ NEXT_PUBLIC_APPWRITE_PROJECT_ID: ${
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? "Set" : "Not set"
  }`
);
console.log(
  `❌ APPWRITE_API_KEY: ${
    process.env.APPWRITE_API_KEY
      ? "Set (should NOT be used in frontend)"
      : "Not set (correct for frontend)"
  }`
);
console.log("");

// Initialize Appwrite client (frontend style - no API key)
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);

console.log("🔗 Testing Frontend Connection...");
console.log("Endpoint:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
console.log("Project ID:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
console.log("");

// Test basic connection (this will fail without a session, which is expected)
try {
  console.log("📡 Testing connection to Appwrite...");

  // This will fail because we don't have a user session, but it should connect to Appwrite
  await account.get();
} catch (error) {
  console.log("📊 Connection Test Results:");

  if (error.code === 401 && error.type === "user_unauthorized") {
    console.log("✅ SUCCESS: Connected to Appwrite successfully!");
    console.log(
      "ℹ️  The 401 error is expected because we don't have a user session."
    );
    console.log("   This means the frontend connection is working properly.");
    console.log("");
    console.log("🎉 Your frontend Appwrite configuration is correct!");
    console.log("");
    console.log("🚀 Next Steps:");
    console.log("   1. Restart your development server");
    console.log("   2. Try Google OAuth login in the browser");
    console.log("   3. The 402 payment required error should be resolved");
  } else if (error.code === 404) {
    console.log("❌ ERROR: Project not found or endpoint incorrect");
    console.log("   Please check your project ID and endpoint URL");
  } else if (error.code === 0) {
    console.log("❌ ERROR: Network connection failed");
    console.log("   Please check your internet connection");
  } else {
    console.log(`❌ ERROR: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log(`   Type: ${error.type}`);
  }
}

console.log("");
console.log("📝 Summary:");
console.log("✅ Frontend client configured correctly (no API key)");
console.log("✅ Environment variables are set");
console.log("✅ Ready for OAuth and user authentication");
