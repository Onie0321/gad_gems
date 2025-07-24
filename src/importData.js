const sdk = require("node-appwrite");
const fs = require("fs");
const path = require("path");
const { ID, Permission, Role } = sdk;

const client = new sdk.Client();
const database = new sdk.Databases(client);

client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("67d029d100075de4c69b") // Replace with new project ID
  .setKey(
    "standard_a4f21fc4b71d1a61b94e2c028cefb4d01d72bedf90e8e11c387e6555c4621b1f1aa39ae646d3130cd3a56af4e8d8bd93423a3d544bd6ac716e90b75b767bf39d8752f8bd19a4e8a1b3434d30e013c4d99db8959ad337cb68a7a048def2cb027bd8cac4fd81b82590cdad9c3cda5894437e66fd583d3504e78dfabdd3f479d06b"
  ); // Replace with new API key

const NEW_DATABASE_ID = "67d029ec00097d264cc9"; // Replace with new database ID

// System fields to exclude from attribute creation
const SYSTEM_FIELDS = [
  "$id",
  "$createdAt",
  "$updatedAt",
  "$permissions",
  "$databaseId",
  "$collectionId",
];

async function importAllCollections() {
  try {
    // Get the directory where the script is located
    const scriptDir = __dirname;
    console.log("Looking for files in:", scriptDir);

    const files = fs
      .readdirSync(scriptDir)
      .filter((file) => file.startsWith("export_") && file.endsWith(".json"));

    console.log("Found files:", files);

    if (files.length === 0) {
      console.log("No export files found to process!");
      return;
    }

    for (const file of files) {
      const collectionName = file.replace("export_", "").replace(".json", "");
      console.log(`Creating collection: ${collectionName}`);

      try {
        // Create collection with updated permissions
        const collection = await database.createCollection(
          NEW_DATABASE_ID,
          ID.unique(),
          collectionName,
          [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
          ],
          false
        );

        // Read sample document to create schema
        const documents = JSON.parse(
          fs.readFileSync(path.join(scriptDir, file), "utf8")
        );

        if (documents.length === 0) {
          console.log(`No documents found in ${file}, skipping...`);
          continue;
        }

        // Create proper attributes based on first document
        const sampleDoc = documents[0];
        for (const [key, value] of Object.entries(sampleDoc)) {
          if (SYSTEM_FIELDS.includes(key)) continue;

          const type = getAttributeType(value);
          await createAttribute(collection.$id, key, type, value);
        }

        console.log(`✅ Created collection schema for ${collectionName}`);
      } catch (err) {
        console.error(
          `Failed to create collection ${collectionName}:`,
          err.message
        );
      }
    }

    console.log("🎉 All collection schemas created!");
  } catch (error) {
    console.error("❌ Import failed:", error);
    console.error("Error details:", error.stack);
  }
}

function getAttributeType(value) {
  switch (typeof value) {
    case "string":
      if (!isNaN(Date.parse(value))) return "datetime";
      return "string";
    case "number":
      return Number.isInteger(value) ? "integer" : "double";
    case "boolean":
      return "boolean";
    case "object":
      if (value === null) return "string";
      if (Array.isArray(value)) return "string[]";
      if (value instanceof Date) return "datetime";
      return "string"; // For objects, store as JSON string
    default:
      return "string";
  }
}

async function createAttribute(collectionId, key, type, sampleValue) {
  try {
    const params = {
      key,
      required: false,
      default: null,
    };

    switch (type) {
      case "string":
        await database.createStringAttribute(
          NEW_DATABASE_ID,
          collectionId,
          key,
          255,
          false,
          null,
          false
        );
        break;
      case "integer":
        await database.createIntegerAttribute(
          NEW_DATABASE_ID,
          collectionId,
          key,
          false,
          0,
          false
        );
        break;
      case "double":
        await database.createFloatAttribute(
          NEW_DATABASE_ID,
          collectionId,
          key,
          false,
          0,
          false
        );
        break;
      case "boolean":
        await database.createBooleanAttribute(
          NEW_DATABASE_ID,
          collectionId,
          key,
          false,
          false,
          false
        );
        break;
      case "datetime":
        await database.createDatetimeAttribute(
          NEW_DATABASE_ID,
          collectionId,
          key,
          false,
          null,
          false
        );
        break;
      case "string[]":
        await database.createStringAttribute(
          NEW_DATABASE_ID,
          collectionId,
          key,
          255,
          false,
          null,
          true
        );
        break;
    }
    console.log(`Created ${type} attribute: ${key}`);
  } catch (err) {
    console.error(`Failed to create attribute ${key}:`, err.message);
  }
}

importAllCollections();
