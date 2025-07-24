// Load environment variables
require("dotenv").config();

const { Client, Databases } = require("node-appwrite");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function testApiKey() {
  try {
    console.log("🔍 Testing API Key permissions...\n");

    console.log("Configuration:");
    console.log("Endpoint:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
    console.log("Project ID:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
    console.log("Database ID:", process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID);
    console.log(
      "API Key:",
      process.env.APPWRITE_API_KEY ? "✅ Set" : "❌ Missing"
    );
    console.log("");

    // Test 1: List databases
    console.log("1. Testing database access...");
    try {
      const databasesList = await databases.list();
      console.log("✅ Successfully listed databases");
      console.log("   Found", databasesList.total, "databases");

      // Check if our target database exists
      const targetDb = databasesList.databases.find(
        (db) => db.$id === process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
      );
      if (targetDb) {
        console.log("✅ Target database found:", targetDb.name);
      } else {
        console.log("❌ Target database NOT found in list");
        console.log("   Available databases:");
        databasesList.databases.forEach((db) => {
          console.log("   -", db.$id, ":", db.name);
        });
      }
    } catch (error) {
      console.log("❌ Failed to list databases:", error.message);
      return;
    }

    // Test 2: List collections in the target database
    console.log("\n2. Testing collection access...");
    try {
      const collectionsList = await databases.listCollections(
        "683e381500342320c476"
      );
      console.log("✅ Successfully listed collections");
      console.log("   Found", collectionsList.total, "collections");

      // Check if our target collection exists
      const targetCollection = collectionsList.collections.find(
        (col) => col.$id === "students_new"
      );
      if (targetCollection) {
        console.log('✅ Target collection "students_new" found');
      } else {
        console.log('❌ Target collection "students_new" NOT found');
        console.log("   Available collections:");
        collectionsList.collections.forEach((col) => {
          console.log("   -", col.$id, ":", col.name);
        });
      }
    } catch (error) {
      console.log("❌ Failed to list collections:", error.message);
      return;
    }

    // Test 3: Try to read documents from the target collection
    console.log("\n3. Testing document access...");
    try {
      const documentsList = await databases.listDocuments(
        "683e381500342320c476",
        "students_new",
        [],
        1
      );
      console.log("✅ Successfully accessed documents");
      console.log(
        "   Found",
        documentsList.total,
        "documents in students_new collection"
      );
    } catch (error) {
      console.log("❌ Failed to access documents:", error.message);
      return;
    }

    console.log(
      "\n🎉 All tests passed! Your API key has the correct permissions."
    );
    console.log("The migration should work now.");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("\nPossible issues:");
    console.log("1. API key might be expired or invalid");
    console.log("2. Database ID might be incorrect");
    console.log("3. Collection ID might be incorrect");
    console.log("4. Network connectivity issues");
  }
}

// Run the test
testApiKey();
