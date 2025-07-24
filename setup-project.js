const {
  Client,
  Databases,
  ID,
  Query,
  Teams,
  Storage,
} = require("node-appwrite");
const fs = require("fs");

// Initialize Appwrite client with admin privileges
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("67d029d100075de4c69b")
  .setKey(
    "standard_a4f21fc4b71d1a61b94e2c028cefb4d01d72bedf90e8e11c387e6555c4621b1f1aa39ae646d3130cd3a56af4e8d8bd93423a3d544bd6ac716e90b75b767bf39d8752f8bd19a4e8a1b3434d30e013c4d99db8959ad337cb68a7a048def2cb027bd8cac4fd81b82590cdad9c3cda5894437e66fd583d3504e78dfabdd3f479d06b"
  );

const databases = new Databases(client);
const teams = new Teams(client);
const storage = new Storage(client);

// Project settings configuration
const projectSettings = {
  database: {
    id: "683e381500342320c476",
    name: "GAD Gems Database",
    collections: {
      users: {
        name: "users",
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { key: "accountId", type: "string", required: true, size: 255 },
          { key: "email", type: "string", required: true, size: 255 },
          { key: "name", type: "string", required: true, size: 255 },
          { key: "role", type: "string", required: true, size: 50 },
          { key: "approvalStatus", type: "string", required: true, size: 50 },
          { key: "isFirstLogin", type: "boolean", required: true },
          { key: "password", type: "string", required: true, size: 255 },
        ],
      },
      events: {
        name: "events",
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { key: "eventName", type: "string", required: true, size: 255 },
          { key: "eventDate", type: "string", required: true, size: 50 },
          { key: "eventTimeFrom", type: "string", required: true, size: 50 },
          { key: "eventTimeTo", type: "string", required: true, size: 50 },
          { key: "eventVenue", type: "string", required: true, size: 255 },
          { key: "eventType", type: "string", required: true, size: 100 },
          { key: "eventCategory", type: "string", required: true, size: 100 },
          { key: "numberOfHours", type: "string", required: true, size: 50 },
          { key: "createdBy", type: "string", required: true, size: 255 },
          { key: "isArchived", type: "boolean", required: true },
          {
            key: "academicPeriodId",
            type: "string",
            required: true,
            size: 255,
          },
        ],
      },
      students: {
        name: "students",
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { key: "eventId", type: "string", required: true, size: 255 },
          { key: "name", type: "string", required: true, size: 255 },
          { key: "sex", type: "string", required: true, size: 50 },
          { key: "age", type: "string", required: true, size: 50 },
          { key: "address", type: "string", required: true, size: 255 },
          { key: "createdBy", type: "string", required: true, size: 255 },
          { key: "isArchived", type: "boolean", required: true },
          {
            key: "academicPeriodId",
            type: "string",
            required: true,
            size: 255,
          },
        ],
      },
    },
  },
  storage: {
    buckets: [
      {
        name: "avatars",
        permissions: ['read("any")', 'write("any")'],
        fileSizeLimit: 5242880, // 5MB
        allowedFileExtensions: ["jpg", "jpeg", "png", "gif"],
      },
      {
        name: "documents",
        permissions: ['read("any")', 'write("any")'],
        fileSizeLimit: 10485760, // 10MB
        allowedFileExtensions: ["pdf", "doc", "docx", "xls", "xlsx"],
      },
    ],
  },
  teams: [
    {
      name: "Administrators",
      roles: ["admin"],
    },
    {
      name: "Users",
      roles: ["user"],
    },
  ],
};

async function setupProject() {
  try {
    console.log("Starting project setup...");

    // Create collections and their attributes
    for (const [collectionId, schema] of Object.entries(
      projectSettings.database.collections
    )) {
      try {
        // Delete existing collection if it exists
        try {
          const collections = await databases.listCollections(
            projectSettings.database.id
          );
          const existingCollection = collections.collections.find(
            (c) => c.name === schema.name
          );
          if (existingCollection) {
            await databases.deleteCollection(
              projectSettings.database.id,
              existingCollection.$id
            );
            console.log(`Deleted existing collection ${schema.name}`);
          }
        } catch (error) {
          console.log(`No existing collection ${schema.name} to delete`);
        }

        // Create new collection
        const collection = await databases.createCollection(
          projectSettings.database.id,
          ID.unique(),
          schema.name,
          schema.permissions
        );
        console.log(`Collection ${schema.name} created successfully`);

        // Create attributes
        for (const attr of schema.attributes) {
          try {
            if (attr.type === "boolean") {
              await databases.createBooleanAttribute(
                projectSettings.database.id,
                collection.$id,
                attr.key,
                attr.required,
                false
              );
            } else {
              await databases.createStringAttribute(
                projectSettings.database.id,
                collection.$id,
                attr.key,
                attr.size || 255, // Default size if not specified
                attr.required,
                false
              );
            }
            console.log(`Attribute ${attr.key} created in ${schema.name}`);
          } catch (error) {
            if (error.code === 409) {
              console.log(
                `Attribute ${attr.key} already exists in ${schema.name}`
              );
            } else {
              throw error;
            }
          }
        }
      } catch (error) {
        console.error(`Error setting up collection ${schema.name}:`, error);
        throw error;
      }
    }

    // Create storage buckets
    for (const bucket of projectSettings.storage.buckets) {
      try {
        await storage.createBucket(
          bucket.name,
          bucket.name,
          bucket.permissions,
          bucket.fileSizeLimit,
          bucket.allowedFileExtensions
        );
        console.log(`Storage bucket ${bucket.name} created successfully`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`Storage bucket ${bucket.name} already exists`);
        } else {
          throw error;
        }
      }
    }

    // Create teams
    for (const team of projectSettings.teams) {
      try {
        await teams.create(ID.unique(), team.name);
        console.log(`Team ${team.name} created successfully`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`Team ${team.name} already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log("Project setup completed successfully!");
  } catch (error) {
    console.error("Project setup failed:", error);
    throw error;
  }
}

// Run the setup
setupProject().catch(console.error);
