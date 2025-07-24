// Load environment variables
require("dotenv").config();

const { Client, Databases } = require("node-appwrite");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Configuration
const databaseId = "683e381500342320c476";
const targetCollectionId = "683e49c8000f1a45f34a";

async function checkCollectionStructure() {
  try {
    console.log("🔍 Checking collection structure...");
    console.log("Database ID:", databaseId);
    console.log("Collection ID:", targetCollectionId);
    console.log("");

    // Get collection details
    const collection = await databases.getCollection(
      databaseId,
      targetCollectionId
    );
    console.log("📋 Collection Details:");
    console.log("   Name:", collection.name);
    console.log("   ID:", collection.$id);
    console.log("   Created:", collection.$createdAt);
    console.log("");

    // Get collection attributes
    const attributes = await databases.listAttributes(
      databaseId,
      targetCollectionId
    );
    console.log("📝 Collection Attributes:");
    console.log("   Total attributes:", attributes.total);
    console.log("");

    attributes.attributes.forEach((attr) => {
      console.log(
        `   - ${attr.key} (${attr.type})${
          attr.required ? " [REQUIRED]" : " [OPTIONAL]"
        }`
      );
      if (attr.default !== undefined) {
        console.log(`     Default: ${attr.default}`);
      }
      if (attr.size) {
        console.log(`     Size: ${attr.size}`);
      }
    });

    // Get a sample document to see the structure
    console.log("\n📄 Sample Document Structure:");
    try {
      const documents = await databases.listDocuments(
        databaseId,
        targetCollectionId,
        [],
        1
      );
      if (documents.documents.length > 0) {
        const sampleDoc = documents.documents[0];
        Object.keys(sampleDoc).forEach((key) => {
          if (!key.startsWith("$")) {
            console.log(`   - ${key}: ${sampleDoc[key]}`);
          }
        });
      } else {
        console.log("   No documents found in collection");
      }
    } catch (error) {
      console.log("   Could not fetch sample document:", error.message);
    }
  } catch (error) {
    console.error("❌ Error checking collection structure:", error);
  }
}

// Run the check
checkCollectionStructure();
