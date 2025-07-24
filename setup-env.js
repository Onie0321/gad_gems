const fs = require("fs");
const path = require("path");

console.log("🔧 Setting up Environment Variables...");
console.log("");

// Check if .env file already exists
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  console.log("⚠️  .env file already exists!");
  console.log(
    "   If you want to update it, please delete the existing file first."
  );
  console.log("   Current .env location:", envPath);
  process.exit(1);
}

// Create .env content
const envContent = `# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=683e381500342320c476

# Appwrite API Key (for server-side operations like migration)
# You need to create an API key in your Appwrite Console with these scopes:
# - databases.read
# - databases.write
# - documents.read
# - documents.write
APPWRITE_API_KEY=your-api-key-here

# Collection IDs
NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID=your-event-collection-id
NEXT_PUBLIC_APPWRITE_NEWS_COLLECTION_ID=your-news-collection-id
NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID=your-user-collection-id
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
  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env file created successfully!");
  console.log("   Location:", envPath);
  console.log("");
  console.log("📝 Next Steps:");
  console.log("1. Open the .env file in your text editor");
  console.log(
    '2. Replace "your-project-id-here" with your actual Appwrite Project ID'
  );
  console.log(
    '3. Replace "your-api-key-here" with your actual Appwrite API Key'
  );
  console.log("4. Update other collection IDs as needed");
  console.log("");
  console.log("🔑 To get your API Key:");
  console.log("1. Go to your Appwrite Console");
  console.log("2. Navigate to Settings > API Keys");
  console.log("3. Create a new API Key with these scopes:");
  console.log("   - databases.read");
  console.log("   - databases.write");
  console.log("   - documents.read");
  console.log("   - documents.write");
  console.log("");
  console.log(
    "⚠️  Important: Make sure your API Key has write permissions to collection: 683e49c8000f1a45f34a"
  );
  console.log("");
  console.log(
    "After updating the .env file, run: node test-api-permissions.js"
  );
} catch (error) {
  console.error("❌ Error creating .env file:", error.message);
  process.exit(1);
}
