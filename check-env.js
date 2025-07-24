// Load environment variables
require("dotenv").config();

console.log("🔍 Checking environment variables...\n");

const requiredEnvVars = {
  NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  NEXT_PUBLIC_APPWRITE_DATABASE_ID:
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
};

let allSet = true;

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (value) {
    console.log(
      `✅ ${key}: ${value.substring(0, 20)}${value.length > 20 ? "..." : ""}`
    );
  } else {
    console.log(`❌ ${key}: NOT SET`);
    allSet = false;
  }
});

console.log("\n" + "=".repeat(50));

if (allSet) {
  console.log("🎉 All environment variables are properly set!");
  console.log("You can now run the migration.");
} else {
  console.log("❌ Some environment variables are missing.");
  console.log("\nPlease add the missing variables to your .env file:");
  console.log("\nExample .env file:");
  console.log("NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-endpoint.com/v1");
  console.log("NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id");
  console.log("NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id");
  console.log("APPWRITE_API_KEY=your-api-key");
}
