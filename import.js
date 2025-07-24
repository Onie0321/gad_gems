const { Client, Databases, ID, Query } = require("appwrite");
const fs = require("fs");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("67d029d100075de4c69b");

const databases = new Databases(client);
const DATABASE_ID = "683e381500342320c476";

// Collection schemas
const collectionSchemas = {
  users: {
    name: "users",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "accountId", type: "string", required: true },
      { key: "email", type: "string", required: true },
      { key: "name", type: "string", required: true },
      { key: "role", type: "string", required: true },
      { key: "approvalStatus", type: "string", required: true },
      { key: "isFirstLogin", type: "boolean", required: true },
      { key: "password", type: "string", required: true },
    ],
  },
  events: {
    name: "events",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "eventName", type: "string", required: true },
      { key: "eventDate", type: "string", required: true },
      { key: "eventTimeFrom", type: "string", required: true },
      { key: "eventTimeTo", type: "string", required: true },
      { key: "eventVenue", type: "string", required: true },
      { key: "eventType", type: "string", required: true },
      { key: "eventCategory", type: "string", required: true },
      { key: "numberOfHours", type: "string", required: true },
      { key: "createdBy", type: "string", required: true },
      { key: "isArchived", type: "boolean", required: true },
      { key: "academicPeriodId", type: "string", required: true },
    ],
  },
  students: {
    name: "students",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "eventId", type: "string", required: true },
      { key: "name", type: "string", required: true },
      { key: "sex", type: "string", required: true },
      { key: "age", type: "string", required: true },
      { key: "address", type: "string", required: true },
      { key: "createdBy", type: "string", required: true },
      { key: "isArchived", type: "boolean", required: true },
      { key: "academicPeriodId", type: "string", required: true },
    ],
  },
};

async function createCollection(schema) {
  try {
    console.log(`Creating collection: ${schema.name}`);
    const collection = await databases.createCollection(
      DATABASE_ID,
      ID.unique(),
      schema.name,
      schema.permissions
    );

    console.log(`Creating attributes for collection: ${schema.name}`);
    for (const attr of schema.attributes) {
      try {
        if (attr.type === "boolean") {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            collection.$id,
            attr.key,
            attr.required,
            false
          );
        } else {
          await databases.createStringAttribute(
            DATABASE_ID,
            collection.$id,
            attr.key,
            attr.required,
            false
          );
        }
        console.log(`Created attribute: ${attr.key}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`Attribute ${attr.key} already exists`);
        } else {
          throw error;
        }
      }
    }

    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log(`Collection ${schema.name} already exists`);
      const collections = await databases.listCollections(DATABASE_ID);
      return collections.collections.find((c) => c.name === schema.name);
    }
    throw error;
  }
}

async function importData() {
  try {
    console.log("Starting import process...");

    // Create collections
    for (const schema of Object.values(collectionSchemas)) {
      await createCollection(schema);
    }

    // Import data from export_users.json if it exists
    if (fs.existsSync("export_users.json")) {
      console.log("Importing user data from export_users.json");
      const userData = JSON.parse(fs.readFileSync("export_users.json", "utf8"));

      for (const user of userData) {
        try {
          await databases.createDocument(DATABASE_ID, "users", ID.unique(), {
            accountId: user.accountId,
            email: user.email,
            name: user.name,
            role: user.role || "user",
            approvalStatus: user.approvalStatus || "pending",
            isFirstLogin: user.isFirstLogin || true,
            password: user.password,
          });
          console.log(`Imported user: ${user.email}`);
        } catch (error) {
          console.error(`Error importing user ${user.email}:`, error.message);
        }
      }
    }

    console.log("Import completed successfully!");
  } catch (error) {
    console.error("Import failed:", error);
  }
}

// Run the import
importData();
