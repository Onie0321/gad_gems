const { Client, Databases, Permission, Role } = require("node-appwrite");

// Configuration - Replace with your actual values
const client = new Client()
  .setEndpoint("https://syd.cloud.appwrite.io/v1")
  .setProject("686d14cb001ff8a18f19")
  .setKey(
    "standard_0938f6740eae1985dd21f3786d3852685c0e94ca5f8092f7b3fd048ed66c3d22f4763db896fe885ddeb2eaf9e862afad7eee1b95023d964c1cc14b4779d931ac0a3e5cbe089b22f0ea1267f14c2448a53fd26d9fe75ec88f6410bcd47bfc3a52a46527bf5f12cb4c7e10cf60f831f2a0edcc47ebed758e8c2e3ffaf7a4c3562f"
  );

const databases = new Databases(client);
const DATABASE_ID = "686d1515003130afaebe";

/**
 * Updates collection permissions to allow role:all for create, read, and update operations
 * @param {string} collectionId - The collection ID to update
 * @param {string} collectionName - The collection name for logging
 */
async function updateCollectionPermissions(collectionId, collectionName) {
  try {
    console.log(
      `🔄 Updating permissions for collection: ${collectionName} (${collectionId})`
    );

    await databases.updateCollection(
      DATABASE_ID,
      collectionId,
      collectionName,
      [
        Permission.create(Role.all()),
        Permission.read(Role.all()),
        Permission.update(Role.all()),
        // Note: We're not adding delete permission as it wasn't requested
      ]
    );

    console.log(
      `✅ Successfully updated permissions for collection: ${collectionName}`
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to update permissions for collection ${collectionName}:`,
      {
        error: error.message,
        code: error.code,
        type: error.type,
      }
    );
    return false;
  }
}

/**
 * Main function to update all collections in the database
 */
async function updateAllCollectionPermissions() {
  try {
    console.log("🚀 Starting collection permissions update...\n");

    // Get all collections
    console.log("📋 Fetching all collections...");
    const collections = await databases.listCollections(DATABASE_ID);

    console.log(`Found ${collections.total} collections to update.\n`);

    let successCount = 0;
    let failureCount = 0;

    // Update each collection
    for (const collection of collections.collections) {
      const success = await updateCollectionPermissions(
        collection.$id,
        collection.name
      );

      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Summary
    console.log("\n📊 Update Summary:");
    console.log(`✅ Successfully updated: ${successCount} collections`);
    console.log(`❌ Failed to update: ${failureCount} collections`);
    console.log(`📈 Total collections processed: ${collections.total}`);

    if (failureCount === 0) {
      console.log("\n🎉 All collections updated successfully!");
    } else {
      console.log(
        "\n⚠️  Some collections failed to update. Check the logs above for details."
      );
    }
  } catch (error) {
    console.error("❌ Error updating collection permissions:", {
      error: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack,
    });
  }
}

/**
 * Test connection to Appwrite
 */
async function testConnection() {
  try {
    console.log("🔍 Testing connection to Appwrite...");
    console.log("📡 Endpoint:", client.config.endpoint);
    console.log("🏢 Project ID:", client.config.project);
    console.log("🗄️  Database ID:", DATABASE_ID);

    // Test basic connectivity first
    console.log("🌐 Testing basic connectivity...");
    const testUrl = "https://syd.cloud.appwrite.io/v1/health";
    const response = await fetch(testUrl);
    console.log("✅ Basic connectivity test passed");

    // Now test Appwrite API
    console.log("🔐 Testing Appwrite API...");
    await databases.listCollections(DATABASE_ID);
    console.log("✅ Connection successful!");
    return true;
  } catch (error) {
    console.error("❌ Connection failed:", {
      error: error.message,
      code: error.code,
      type: error.type,
      response: error.response,
    });

    // Provide specific troubleshooting tips
    if (error.message.includes("fetch failed")) {
      console.log("\n💡 Troubleshooting tips:");
      console.log("1. Check your internet connection");
      console.log("2. Verify the endpoint URL is correct");
      console.log("3. Ensure your API key has the required permissions");
      console.log("4. Try updating Node.js to a newer version");
      console.log("5. Check if your firewall is blocking the connection");
    }

    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🔧 Collection Permissions Update Script");
  console.log("=====================================\n");

  // Test connection first
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log(
      "\n❌ Cannot proceed due to connection issues. Please check your configuration."
    );
    process.exit(1);
  }

  console.log("\n");

  // Update all collections
  await updateAllCollectionPermissions();

  console.log("\n🏁 Script completed.");
}

// Run the script
main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
