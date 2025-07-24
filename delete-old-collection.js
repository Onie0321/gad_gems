// Load environment variables
require("dotenv").config();

const { Client, Databases } = require("node-appwrite");
const fs = require("fs");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Collection IDs
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const oldCollectionId = "students_new";

// Read the new collection ID from migration config
let newCollectionId = null;
try {
  const configData = JSON.parse(
    fs.readFileSync("migration-config.json", "utf8")
  );
  newCollectionId = configData.newCollectionId;
  console.log("📄 Found migration config:", configData);
} catch (error) {
  console.error(
    "❌ Could not read migration-config.json. Please run the migration first."
  );
  process.exit(1);
}

async function deleteOldCollection() {
  try {
    console.log("Starting old collection deletion process...");
    console.log("Database ID:", databaseId);
    console.log("Old Collection ID:", oldCollectionId);
    console.log("New Collection ID:", newCollectionId);

    // Step 1: Verify new collection exists and has data
    console.log("\n1. Verifying new collection...");
    const newCollectionData = await databases.listDocuments(
      databaseId,
      newCollectionId
    );

    console.log(`✅ New collection has ${newCollectionData.total} documents`);

    if (newCollectionData.total === 0) {
      console.log("❌ New collection is empty! Aborting deletion.");
      return;
    }

    // Step 2: Get count from old collection for comparison
    console.log("\n2. Checking old collection...");
    const oldCollectionData = await databases.listDocuments(
      databaseId,
      oldCollectionId
    );

    console.log(`📊 Old collection has ${oldCollectionData.total} documents`);
    console.log(`📊 New collection has ${newCollectionData.total} documents`);

    if (newCollectionData.total < oldCollectionData.total) {
      console.log(
        "⚠️ Warning: New collection has fewer documents than old collection!"
      );
      console.log("This might indicate incomplete migration.");

      const proceed = process.argv.includes("--force");
      if (!proceed) {
        console.log(
          "Use --force flag to proceed anyway, or check the migration first."
        );
        return;
      }
    }

    // Step 3: Confirm deletion
    console.log("\n3. Confirming deletion...");
    console.log(
      "This will permanently delete the old collection and all its data."
    );
    console.log("Make sure you have verified the migration is complete.");

    const confirm = process.argv.includes("--confirm");
    if (!confirm) {
      console.log("Use --confirm flag to proceed with deletion.");
      console.log("Example: node delete-old-collection.js --confirm");
      return;
    }

    // Step 4: Delete old collection
    console.log("\n4. Deleting old collection...");
    await databases.deleteCollection(databaseId, oldCollectionId);
    console.log("✅ Old collection deleted successfully!");

    // Step 5: Final verification
    console.log("\n5. Final verification...");
    try {
      await databases.listDocuments(databaseId, oldCollectionId);
      console.log("❌ Error: Old collection still exists!");
    } catch (error) {
      if (error.code === 404) {
        console.log("✅ Confirmed: Old collection no longer exists");
      } else {
        console.log(
          "⚠️ Unexpected error checking old collection:",
          error.message
        );
      }
    }

    console.log("\n🎉 Old collection deletion completed!");
    console.log("\nNext steps:");
    console.log("1. Update your appwrite.js file to use the new collection ID");
    console.log("2. Test your application thoroughly");
    console.log("3. Monitor for any issues");
  } catch (error) {
    console.error("❌ Deletion failed:", error);
    process.exit(1);
  }
}

// Run the deletion
deleteOldCollection();
