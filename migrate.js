const { Client, Databases, ID, Query, Account } = require("appwrite");

// Initialize Appwrite client for source database
const sourceClient = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("67d119b6002dc54d2841"); // Source project ID

// Initialize Appwrite client for target database
const targetClient = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("67d029d100075de4c69b"); // Target project ID

const sourceDatabases = new Databases(sourceClient);
const targetDatabases = new Databases(targetClient);
const sourceAccount = new Account(sourceClient);
const targetAccount = new Account(targetClient);

// Source database ID (old database)
const SOURCE_DATABASE_ID = "67d029ec00097d264cc9";

// Target database ID (new database)
const TARGET_DATABASE_ID = "67d029ec00097d264cc9";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10, // Maximum number of requests per interval
  interval: 1000, // Interval in milliseconds (1 second)
  retryDelay: 2000, // Delay between retries in milliseconds (2 seconds)
  maxRetries: 3, // Maximum number of retries for a failed request
};

// Rate limiter class
class RateLimiter {
  constructor(maxRequests, interval) {
    this.maxRequests = maxRequests;
    this.interval = interval;
    this.requests = [];
  }

  async waitForSlot() {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.interval);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.interval - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      this.requests = this.requests.filter(
        (time) => Date.now() - time < this.interval
      );
    }

    this.requests.push(Date.now());
  }
}

// Create rate limiters for different operations
const accountRateLimiter = new RateLimiter(
  RATE_LIMIT.maxRequests,
  RATE_LIMIT.interval
);
const databaseRateLimiter = new RateLimiter(
  RATE_LIMIT.maxRequests,
  RATE_LIMIT.interval
);

// Helper function to retry operations
async function retryOperation(operation, retryCount = 0) {
  try {
    await databaseRateLimiter.waitForSlot();
    return await operation();
  } catch (error) {
    if (error.code === 429 && retryCount < RATE_LIMIT.maxRetries) {
      console.log(
        `Rate limit hit, retrying in ${RATE_LIMIT.retryDelay}ms... (Attempt ${
          retryCount + 1
        }/${RATE_LIMIT.maxRetries})`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT.retryDelay)
      );
      return retryOperation(operation, retryCount + 1);
    }
    throw error;
  }
}

// List of all collection IDs
const COLLECTIONS = [
  "users",
  "events",
  "students",
  "questions",
  "responses",
  "forms",
  "employees",
  "employeesSurvey",
  "notifications",
  "activityLogs",
  "news",
  "staffFaculty",
  "community",
  "academicPeriod",
  "personal",
  "demographics",
  "employmentDetails",
  "genderAwareness",
  "familyFinancial",
  "childFamPlan",
  "healthMedInfo",
  "lifestyle",
  "workplace",
  "access",
  "physical",
];

// Function to create users collection if it doesn't exist
async function createUsersCollection() {
  try {
    console.log("Checking if users collection exists...");

    // First try to get the collection to see if it exists
    try {
      const existingCollection = await targetDatabases.getCollection(
        TARGET_DATABASE_ID,
        "users"
      );
      console.log("Users collection already exists:", existingCollection);
      return existingCollection;
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
      console.log("Users collection does not exist, creating it...");
    }

    // Create the users collection
    const collection = await targetDatabases.createCollection(
      TARGET_DATABASE_ID,
      "users",
      "Users Collection",
      ['create("any")', 'read("any")', 'update("any")', 'delete("any")']
    );

    console.log("Created users collection, adding attributes...");

    // Create required attributes
    const attributes = [
      {
        name: "accountId",
        type: "string",
        required: true,
        size: 255,
      },
      {
        name: "email",
        type: "string",
        required: true,
        size: 255,
      },
      {
        name: "name",
        type: "string",
        required: true,
        size: 255,
      },
      {
        name: "role",
        type: "string",
        required: true,
        size: 50,
      },
      {
        name: "approvalStatus",
        type: "string",
        required: true,
        size: 50,
      },
      {
        name: "isFirstLogin",
        type: "boolean",
        required: true,
      },
      {
        name: "password",
        type: "string",
        required: false,
        size: 255,
      },
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === "string") {
          await targetDatabases.createStringAttribute(
            TARGET_DATABASE_ID,
            "users",
            attr.name,
            attr.size,
            attr.required
          );
        } else if (attr.type === "boolean") {
          await targetDatabases.createBooleanAttribute(
            TARGET_DATABASE_ID,
            "users",
            attr.name,
            attr.required
          );
        }
        console.log(`Created attribute: ${attr.name}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`Attribute ${attr.name} already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log("Users collection created successfully with all attributes");
    return collection;
  } catch (error) {
    console.error("Error creating users collection:", error);
    throw new Error(`Failed to create users collection: ${error.message}`);
  }
}

// Function to import users from export_users.json
async function importUsersFromJson() {
  try {
    console.log("Importing users from export_users.json...");

    // Read the JSON file
    const fs = require("fs");
    const usersData = JSON.parse(fs.readFileSync("export_users.json", "utf8"));

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const user of usersData) {
      try {
        await accountRateLimiter.waitForSlot();

        console.log(`Migrating user: ${user.email}`);

        // Create user account in target project
        const newAccount = await retryOperation(() =>
          targetAccount.create(
            user.$id,
            user.email,
            user.password || "temporaryPassword123!",
            user.name
          )
        );

        console.log(`Created account for user: ${user.email}`);

        // Create user document in target database
        const userDoc = await retryOperation(() =>
          targetDatabases.createDocument(
            TARGET_DATABASE_ID,
            "users",
            user.$id,
            {
              accountId: user.$id,
              email: user.email,
              name: user.name,
              role: user.role || "user",
              approvalStatus: user.approvalStatus || "pending",
              isFirstLogin: true,
              password: user.password || "temporaryPassword123!", // Store password temporarily
            }
          )
        );

        console.log(`Created user document for: ${user.email}`);

        // Create a session for the user
        try {
          const session = await retryOperation(() =>
            targetAccount.createEmailSession(
              user.email,
              user.password || "temporaryPassword123!"
            )
          );

          console.log(`Created session for user: ${user.email}`);

          // Delete the session after creation
          await retryOperation(() => targetAccount.deleteSession("current"));
          console.log(`Cleaned up session for user: ${user.email}`);
        } catch (sessionError) {
          console.warn(
            `Could not create session for user ${user.email}:`,
            sessionError
          );
        }

        results.successful++;
        console.log(`Successfully migrated user: ${user.email}`);

        // Add a longer delay between users to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: user.email,
          error: error.message,
        });
        console.error(`Failed to migrate user ${user.email}:`, error);
      }
    }

    console.log("User import completed with results:", results);
    return results;
  } catch (error) {
    console.error("User import failed:", error);
    throw new Error(`User import failed: ${error.message}`);
  }
}

// Function to export data from a collection
async function exportCollection(collectionId) {
  try {
    console.log(`Exporting data from collection: ${collectionId}`);
    const response = await retryOperation(() =>
      sourceDatabases.listDocuments(SOURCE_DATABASE_ID, collectionId, [
        Query.limit(1000),
      ])
    );
    console.log(
      `Successfully exported ${response.total} documents from ${collectionId}`
    );
    return response.documents;
  } catch (error) {
    console.error(`Error exporting collection ${collectionId}:`, error);
    return [];
  }
}

// Function to import data to a collection
async function importCollection(collectionId, documents) {
  const results = {
    successful: 0,
    failed: 0,
    errors: [],
  };

  console.log(
    `Importing ${documents.length} documents to collection: ${collectionId}`
  );

  for (const document of documents) {
    try {
      // Remove Appwrite-specific fields
      const { $id, $createdAt, $updatedAt, $permissions, ...cleanDocument } =
        document;

      // Create new document in target database
      await retryOperation(() =>
        targetDatabases.createDocument(
          TARGET_DATABASE_ID,
          collectionId,
          ID.unique(),
          cleanDocument
        )
      );

      results.successful++;
      if (results.successful % 100 === 0) {
        console.log(
          `Imported ${results.successful} documents to ${collectionId}`
        );
      }

      // Add a small delay between documents
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      results.failed++;
      results.errors.push({
        documentId: document.$id,
        error: error.message,
      });
      console.error(
        `Error importing document ${document.$id} to ${collectionId}:`,
        error
      );
    }
  }

  return results;
}

// Main migration function
async function migrateData() {
  console.log("Starting data migration...");
  console.log("Source Project ID:", sourceClient.config.project);
  console.log("Target Project ID:", targetClient.config.project);
  console.log("Database ID:", TARGET_DATABASE_ID);

  const migrationResults = {
    startTime: new Date(),
    collections: {},
    totalSuccessful: 0,
    totalFailed: 0,
  };

  // First create the users collection
  await createUsersCollection();

  // Then import users from export_users.json
  console.log("\nImporting users from export_users.json...");
  const userMigrationResults = await importUsersFromJson();
  migrationResults.userAccounts = userMigrationResults;

  // Then migrate all other collections
  for (const collectionId of COLLECTIONS.filter((c) => c !== "users")) {
    console.log(`\nProcessing collection: ${collectionId}`);

    // Export data
    const documents = await exportCollection(collectionId);

    if (documents.length === 0) {
      console.log(`No documents found in collection ${collectionId}`);
      continue;
    }

    // Import data
    const importResults = await importCollection(collectionId, documents);

    // Store results
    migrationResults.collections[collectionId] = {
      exported: documents.length,
      imported: importResults.successful,
      failed: importResults.failed,
      errors: importResults.errors,
    };

    migrationResults.totalSuccessful += importResults.successful;
    migrationResults.totalFailed += importResults.failed;

    console.log(`Completed migration for ${collectionId}:`);
    console.log(`- Exported: ${documents.length}`);
    console.log(`- Imported: ${importResults.successful}`);
    console.log(`- Failed: ${importResults.failed}`);
  }

  migrationResults.endTime = new Date();
  migrationResults.duration =
    (migrationResults.endTime - migrationResults.startTime) / 1000;

  console.log("\nMigration Summary:");
  console.log("=================");
  console.log("User Accounts:");
  console.log(`- Successfully migrated: ${userMigrationResults.successful}`);
  console.log(`- Failed to migrate: ${userMigrationResults.failed}`);
  console.log("\nCollections:");
  console.log(`Total Successful: ${migrationResults.totalSuccessful}`);
  console.log(`Total Failed: ${migrationResults.totalFailed}`);
  console.log(`Duration: ${migrationResults.duration} seconds`);

  // Save results to file
  const fs = require("fs");
  fs.writeFileSync(
    "migration-results.json",
    JSON.stringify(migrationResults, null, 2)
  );
  console.log("\nMigration results saved to migration-results.json");

  return migrationResults;
}

// Run the migration
migrateData()
  .then(() => {
    console.log("Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
