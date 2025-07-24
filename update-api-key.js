const fs = require("fs");
const path = require("path");

// Your new API key
const NEW_API_KEY =
  "standard_5d32a361affff9d5c9f3a55c3d257d7f05c6a1d6cb6b00d1d788bd04c4355f43d339cb8d104cbc1c11de7b2abbc904a278724da63fcf853adffa784cd3ec3829256693be4afa73772e89e694cc197d39a334e8803f6dc1ad586480f21d0f8c211120f2314f4e049b23364ad4a57a47b499fb6d073b787217cd7788ce232db488";

console.log("🔧 Updating API Key in Environment File...");
console.log("");

// Check for different possible env file names
const possibleEnvFiles = [".env.local", ".env", ".env.development"];
let envPath = null;

for (const fileName of possibleEnvFiles) {
  const filePath = path.join(__dirname, fileName);
  if (fs.existsSync(filePath)) {
    envPath = filePath;
    console.log(`✅ Found environment file: ${fileName}`);
    break;
  }
}

if (!envPath) {
  console.log("❌ No environment file found!");
  console.log("Creating .env.local file with your new API key...");

  const envContent = `# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=67d029d100075de4c69b
NEXT_PUBLIC_APPWRITE_DATABASE_ID=683e381500342320c476

# Appwrite API Key (Updated with bypass limits)
APPWRITE_API_KEY=${NEW_API_KEY}

# Collection IDs (Update these with your actual collection IDs)
NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID=your-event-collection-id
NEXT_PUBLIC_APPWRITE_NEWS_COLLECTION_ID=your-news-collection-id
NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID=your-user-collection-id
NEXT_PUBLIC_APPWRITE_STUDENT_COLLECTION_ID=your-student-collection-id
NEXT_PUBLIC_APPWRITE_STAFF_FACULTY_COLLECTION_ID=your-staff-faculty-collection-id
NEXT_PUBLIC_APPWRITE_COMMUNITY_COLLECTION_ID=your-community-collection-id
NEXT_PUBLIC_APPWRITE_ACADEMIC_PERIOD_COLLECTION_ID=your-academic-period-collection-id
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID=your-notifications-collection-id

# Employee-related collection IDs
NEXT_PUBLIC_APPWRITE_EPERSONAL_COLLECTION_ID=your-personal-collection-id
NEXT_PUBLIC_APPWRITE_EEMPLOYMENT_DETAILS_COLLECTION_ID=your-employment-details-collection-id
NEXT_PUBLIC_APPWRITE_ACTIVITY_COLLECTION_ID=your-activity-collection-id
NEXT_PUBLIC_APPWRITE_ACTIVITY_LOGS_COLLECTION_ID=your-activity-logs-collection-id
`;

  try {
    fs.writeFileSync(".env.local", envContent);
    console.log("✅ Created .env.local file with your new API key!");
    console.log("📝 Please update the collection IDs with your actual values.");
  } catch (error) {
    console.error("❌ Error creating .env.local file:", error.message);
    process.exit(1);
  }
} else {
  // Update existing env file
  try {
    let envContent = fs.readFileSync(envPath, "utf8");

    // Check if APPWRITE_API_KEY already exists
    if (envContent.includes("APPWRITE_API_KEY=")) {
      // Replace existing API key
      envContent = envContent.replace(
        /APPWRITE_API_KEY=.*/,
        `APPWRITE_API_KEY=${NEW_API_KEY}`
      );
      console.log("✅ Updated existing API key in environment file");
    } else {
      // Add new API key
      envContent += `\n# Appwrite API Key (Updated with bypass limits)\nAPPWRITE_API_KEY=${NEW_API_KEY}\n`;
      console.log("✅ Added new API key to environment file");
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Environment file updated: ${envPath}`);
  } catch (error) {
    console.error("❌ Error updating environment file:", error.message);
    process.exit(1);
  }
}

console.log("");
console.log("🔍 Testing the new API key...");
console.log("");

// Test the API key
const { Client, Account, Databases } = require("node-appwrite");
require("dotenv").config({ path: envPath || ".env.local" });

async function testNewApiKey() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const account = new Account(client);
  const databases = new Databases(client);

  try {
    console.log("🔗 Testing connection with new API key...");

    // Test basic connection
    const user = await account.get();
    console.log("✅ Authentication successful!");
    console.log(`👤 User: ${user.name} (${user.email})`);

    // Test database access
    const dbList = await databases.list();
    console.log(
      `✅ Database access successful! Found ${dbList.total} databases`
    );

    console.log("");
    console.log("🎉 Your new API key is working perfectly!");
    console.log("");
    console.log("🚀 You can now:");
    console.log("   1. Restart your development server");
    console.log("   2. Test Google OAuth login");
    console.log("   3. Use all Appwrite features without 402 errors");
  } catch (error) {
    console.error("❌ Error testing new API key:");
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Type: ${error.type}`);

    if (error.code === 401) {
      console.log("");
      console.log(
        "🔑 401 Error - The API key might still have permission issues"
      );
      console.log("   Please check that the API key has all required scopes:");
      console.log("   - account");
      console.log("   - databases.read");
      console.log("   - databases.write");
    }
  }
}

testNewApiKey().catch(console.error);
