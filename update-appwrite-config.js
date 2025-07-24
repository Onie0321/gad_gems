// Load environment variables
require("dotenv").config();

const fs = require("fs");

async function updateAppwriteConfig() {
  try {
    console.log("Updating appwrite.js with new collection ID...");

    // Read the migration config
    const configData = JSON.parse(
      fs.readFileSync("migration-config.json", "utf8")
    );
    const newCollectionId = configData.newCollectionId;

    console.log("📄 Migration config:", configData);
    console.log("🆔 New Collection ID:", newCollectionId);

    // Read the current appwrite.js file
    const appwritePath = "src/lib/appwrite.js";
    let appwriteContent = fs.readFileSync(appwritePath, "utf8");

    // Update the studentCollectionId line
    const oldLine = /export const studentCollectionId = "[^"]*";/;
    const newLine = `export const studentCollectionId = "${newCollectionId}";`;

    if (oldLine.test(appwriteContent)) {
      appwriteContent = appwriteContent.replace(oldLine, newLine);

      // Write the updated content back
      fs.writeFileSync(appwritePath, appwriteContent);

      console.log("✅ Successfully updated src/lib/appwrite.js");
      console.log(`✅ Changed studentCollectionId to: "${newCollectionId}"`);
    } else {
      console.log("⚠️ Could not find studentCollectionId line in appwrite.js");
      console.log("Please manually update the file with:");
      console.log(`export const studentCollectionId = "${newCollectionId}";`);
    }

    console.log("\n🎉 Configuration update completed!");
    console.log("\nNext steps:");
    console.log("1. Test your application with the new collection");
    console.log("2. Verify all functionality works correctly");
    console.log("3. Delete the old collection when ready");
  } catch (error) {
    console.error("❌ Failed to update configuration:", error);

    if (error.code === "ENOENT") {
      console.log(
        "\n📄 migration-config.json not found. Please run the migration first:"
      );
      console.log("node migrate-students.js");
    }

    process.exit(1);
  }
}

// Run the update
updateAppwriteConfig();
