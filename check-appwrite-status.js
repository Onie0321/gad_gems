const { Client, Account, Databases } = require("node-appwrite");

// Load environment variables
require("dotenv").config();

async function checkAppwriteStatus() {
  console.log("🔍 Checking Appwrite Project Status...\n");

  // Check if environment variables are set
  const requiredEnvVars = [
    "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    "APPWRITE_API_KEY",
  ];

  console.log("📋 Environment Variables Check:");
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(
        `✅ ${envVar}: ${envVar.includes("KEY") ? "***SET***" : value}`
      );
    } else {
      console.log(`❌ ${envVar}: NOT SET`);
    }
  }
  console.log("");

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const account = new Account(client);
  const databases = new Databases(client);

  try {
    console.log("🔗 Testing Appwrite Connection...");

    // Test basic connection
    const user = await account.get();
    console.log("✅ Authentication successful");
    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log("");

    // Test database access
    console.log("🗄️ Testing Database Access...");
    const dbList = await databases.list();
    console.log(`✅ Found ${dbList.total} databases`);

    if (dbList.databases.length > 0) {
      console.log("📊 Available Databases:");
      dbList.databases.forEach((db) => {
        console.log(`   - ${db.name} (${db.$id})`);
      });
    }
    console.log("");

    // Check project usage (if possible)
    console.log("📈 Project Usage Information:");
    console.log("ℹ️  To check detailed usage and billing:");
    console.log("   1. Go to https://cloud.appwrite.io/console");
    console.log("   2. Select your project");
    console.log('   3. Check the "Usage" tab');
    console.log('   4. Verify billing status in "Settings" > "Billing"');
    console.log("");

    console.log("🎉 Appwrite connection is working properly!");
    console.log("");
    console.log("💡 If you're still getting 402 errors:");
    console.log("   1. Check your Appwrite project billing status");
    console.log("   2. Verify you haven't exceeded usage limits");
    console.log("   3. Consider upgrading your plan if needed");
    console.log("   4. Check if your API key has proper permissions");
  } catch (error) {
    console.error("❌ Error connecting to Appwrite:");
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Type: ${error.type}`);

    if (error.code === 402) {
      console.log("");
      console.log("💰 402 Payment Required - Solutions:");
      console.log("   1. Check your Appwrite project billing status");
      console.log("   2. Verify your payment method is up to date");
      console.log("   3. Check if you've exceeded your plan limits");
      console.log("   4. Consider upgrading to a higher tier");
      console.log("   5. Contact Appwrite support if needed");
    } else if (error.code === 401) {
      console.log("");
      console.log("🔑 401 Unauthorized - Solutions:");
      console.log("   1. Verify your API key is correct");
      console.log("   2. Check if your API key has proper permissions");
      console.log("   3. Ensure your project ID is correct");
    } else if (error.code === 404) {
      console.log("");
      console.log("🔍 404 Not Found - Solutions:");
      console.log("   1. Verify your project ID is correct");
      console.log("   2. Check if your endpoint URL is correct");
      console.log("   3. Ensure the project exists and is accessible");
    }
  }
}

// Run the check
checkAppwriteStatus().catch(console.error);
