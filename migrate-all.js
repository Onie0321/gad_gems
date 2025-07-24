const { Client, Databases, ID, Query } = require("node-appwrite");
const fs = require("fs");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("67d029d100075de4c69b")
  .setKey(
    "standard_a4f21fc4b71d1a61b94e2c028cefb4d01d72bedf90e8e11c387e6555c4621b1f1aa39ae646d3130cd3a56af4e8d8bd93423a3d544bd6ac716e90b75b767bf39d8752f8bd19a4e8a1b3434d30e013c4d99db8959ad337cb68a7a048def2cb027bd8cac4fd81b82590cdad9c3cda5894437e66fd583d3504e78dfabdd3f479d06b"
  );

const databases = new Databases(client);

// Database and collection IDs
const DATABASE_ID = "683e381500342320c476";

// Collection schemas
const COLLECTIONS = {
  academicPeriod: {
    name: "academicPeriod",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "startDate", type: "string", required: true, size: 50 },
      { key: "endDate", type: "string", required: true, size: 50 },
      { key: "schoolYear", type: "string", required: true, size: 50 },
      { key: "periodType", type: "string", required: true, size: 50 },
      { key: "isActive", type: "boolean", required: true },
      { key: "archivedAt", type: "string", required: false, size: 50 },
      { key: "createdAt", type: "string", required: true, size: 50 },
      { key: "createdBy", type: "string", required: false, size: 255 },
      { key: "endingNotified", type: "boolean", required: false },
      { key: "endedNotified", type: "boolean", required: false },
    ],
  },
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
      { key: "academicPeriodId", type: "string", required: true, size: 255 },
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
      { key: "academicPeriodId", type: "string", required: true, size: 255 },
      { key: "studentId", type: "string", required: false, size: 255 },
      { key: "school", type: "string", required: false, size: 255 },
      { key: "year", type: "string", required: false, size: 50 },
      { key: "section", type: "string", required: false, size: 50 },
      { key: "ethnicGroup", type: "string", required: false, size: 100 },
      { key: "otherEthnicGroup", type: "string", required: false, size: 255 },
    ],
  },
  staffFaculty: {
    name: "staffFaculty",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "eventId", type: "string", required: true, size: 255 },
      { key: "name", type: "string", required: true, size: 255 },
      { key: "sex", type: "string", required: true, size: 50 },
      { key: "age", type: "string", required: true, size: 50 },
      { key: "address", type: "string", required: true, size: 255 },
      { key: "createdBy", type: "string", required: true, size: 255 },
      { key: "isArchived", type: "boolean", required: true },
      { key: "academicPeriodId", type: "string", required: true, size: 255 },
      { key: "staffFacultyId", type: "string", required: false, size: 255 },
      { key: "ethnicGroup", type: "string", required: false, size: 100 },
      { key: "otherEthnicGroup", type: "string", required: false, size: 255 },
    ],
  },
  community: {
    name: "community",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "eventId", type: "string", required: true, size: 255 },
      { key: "name", type: "string", required: true, size: 255 },
      { key: "sex", type: "string", required: true, size: 50 },
      { key: "age", type: "string", required: true, size: 50 },
      { key: "address", type: "string", required: true, size: 255 },
      { key: "createdBy", type: "string", required: true, size: 255 },
      { key: "isArchived", type: "boolean", required: true },
      { key: "academicPeriodId", type: "string", required: true, size: 255 },
      { key: "ethnicGroup", type: "string", required: false, size: 100 },
      { key: "otherEthnicGroup", type: "string", required: false, size: 255 },
    ],
  },
  activityLogs: {
    name: "activityLogs",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "userId", type: "string", required: true, size: 255 },
      { key: "action", type: "string", required: true, size: 255 },
      { key: "details", type: "string", required: false, size: 1000 },
      { key: "timestamp", type: "string", required: true, size: 50 },
      { key: "ipAddress", type: "string", required: false, size: 50 },
    ],
  },
  archives: {
    name: "archives",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "documentId", type: "string", required: true, size: 255 },
      { key: "collectionId", type: "string", required: true, size: 255 },
      { key: "archivedAt", type: "string", required: true, size: 50 },
      { key: "archivedBy", type: "string", required: true, size: 255 },
      { key: "reason", type: "string", required: false, size: 1000 },
    ],
  },
  contacts: {
    name: "contacts",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "name", type: "string", required: true, size: 255 },
      { key: "email", type: "string", required: true, size: 255 },
      { key: "phone", type: "string", required: false, size: 50 },
      { key: "message", type: "string", required: true, size: 1000 },
      { key: "createdAt", type: "string", required: true, size: 50 },
      { key: "isRead", type: "boolean", required: true },
    ],
  },
  dynamicData: {
    name: "dynamicData",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "key", type: "string", required: true, size: 255 },
      { key: "value", type: "string", required: true, size: 1000 },
      { key: "type", type: "string", required: true, size: 50 },
      { key: "updatedAt", type: "string", required: true, size: 50 },
    ],
  },
  eChildFam: {
    name: "eChildFam",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "hasChildren", type: "boolean", required: true },
      { key: "childrenAge0to6", type: "string", required: true, size: 50 },
      { key: "childrenAge7to18", type: "string", required: true, size: 50 },
      { key: "childrenAge18Plus", type: "string", required: true, size: 50 },
      { key: "considerHavingChild", type: "boolean", required: false },
      { key: "wantMoreChildren", type: "boolean", required: false },
      {
        key: "waitingPeriodNextChild",
        type: "string",
        required: false,
        size: 100,
      },
      {
        key: "averageAgeGapChildren",
        type: "string",
        required: false,
        size: 100,
      },
      { key: "useDayCareServices", type: "boolean", required: false },
      { key: "needDayCareFacility", type: "boolean", required: false },
      { key: "needLactationRoom", type: "boolean", required: false },
      { key: "year", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
      { key: "employeeId", type: "string", required: true, size: 255 },
    ],
  },
  eDemographics: {
    name: "eDemographics",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "age", type: "string", required: true, size: 50 },
      { key: "sex", type: "string", required: true, size: 50 },
      { key: "civilStatus", type: "string", required: true, size: 50 },
      { key: "religion", type: "string", required: false, size: 100 },
      { key: "ethnicity", type: "string", required: false, size: 100 },
      { key: "year", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
      { key: "employeeId", type: "string", required: true, size: 255 },
    ],
  },
  eEmploymentDetails: {
    name: "eEmploymentDetails",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "position", type: "string", required: true, size: 255 },
      { key: "department", type: "string", required: true, size: 255 },
      { key: "employmentStatus", type: "string", required: true, size: 50 },
      { key: "yearsOfService", type: "string", required: true, size: 50 },
      { key: "year", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
      { key: "employeeId", type: "string", required: true, size: 255 },
    ],
  },
  eFamilyFinancial: {
    name: "eFamilyFinancial",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "totalIncome", type: "string", required: true, size: 500 },
      { key: "householdSize", type: "string", required: true, size: 100 },
      { key: "outsideSupport", type: "string", required: true, size: 100 },
      { key: "incomeSources", type: "string", required: true, size: 255 },
      { key: "majorContributor", type: "boolean", required: true },
      {
        key: "majorContributorSpecify",
        type: "string",
        required: false,
        size: 255,
      },
      { key: "soleFinanceManager", type: "boolean", required: true },
      {
        key: "soleFinanceManagerSpecify",
        type: "string",
        required: false,
        size: 255,
      },
      { key: "hasSavings", type: "string", required: true, size: 100 },
      { key: "year", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
      { key: "employeeId", type: "string", required: true, size: 255 },
    ],
  },
  eGenderAwareness: {
    name: "eGenderAwareness",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "awareGadAct", type: "boolean", required: true },
      { key: "awareGadSpecify", type: "string", required: false, size: 255 },
      { key: "participateGadAct", type: "boolean", required: true },
      { key: "awareGadFbPage", type: "boolean", required: true },
      { key: "visitedGadFbPage", type: "boolean", required: true },
      { key: "awareLaws", type: "string", required: true, size: 2000 },
      { key: "year", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
      { key: "employeeId", type: "string", required: true, size: 255 },
    ],
  },
  ePersonal: {
    name: "ePersonal",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "name", type: "string", required: true, size: 255 },
      { key: "email", type: "string", required: true, size: 255 },
      { key: "phone", type: "string", required: false, size: 50 },
      { key: "address", type: "string", required: true, size: 255 },
      { key: "year", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
      { key: "employeeId", type: "string", required: true, size: 255 },
    ],
  },
  forms: {
    name: "forms",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "title", type: "string", required: true, size: 255 },
      { key: "description", type: "string", required: false, size: 1000 },
      { key: "fields", type: "string", required: true, size: 2000 },
      { key: "createdBy", type: "string", required: true, size: 255 },
      { key: "createdAt", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
    ],
  },
  messages: {
    name: "messages",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "senderId", type: "string", required: true, size: 255 },
      { key: "receiverId", type: "string", required: true, size: 255 },
      { key: "content", type: "string", required: true, size: 1000 },
      { key: "timestamp", type: "string", required: true, size: 50 },
      { key: "isRead", type: "boolean", required: true },
    ],
  },
  news: {
    name: "news",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "title", type: "string", required: true, size: 255 },
      { key: "content", type: "string", required: true, size: 2000 },
      { key: "imageUrl", type: "string", required: false, size: 255 },
      { key: "createdBy", type: "string", required: true, size: 255 },
      { key: "createdAt", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
    ],
  },
  notifications: {
    name: "notifications",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "userId", type: "string", required: true, size: 255 },
      { key: "title", type: "string", required: true, size: 255 },
      { key: "message", type: "string", required: true, size: 1000 },
      { key: "type", type: "string", required: true, size: 50 },
      { key: "isRead", type: "boolean", required: true },
      { key: "createdAt", type: "string", required: true, size: 50 },
    ],
  },
  questions: {
    name: "questions",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "formId", type: "string", required: true, size: 255 },
      { key: "question", type: "string", required: true, size: 1000 },
      { key: "type", type: "string", required: true, size: 50 },
      { key: "options", type: "string", required: false, size: 1000 },
      { key: "required", type: "boolean", required: true },
      { key: "order", type: "string", required: true, size: 50 },
    ],
  },
  regForm: {
    name: "regForm",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "formId", type: "string", required: true, size: 255 },
      { key: "userId", type: "string", required: true, size: 255 },
      { key: "status", type: "string", required: true, size: 50 },
      { key: "submittedAt", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
    ],
  },
  responses: {
    name: "responses",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "formId", type: "string", required: true, size: 255 },
      { key: "questionId", type: "string", required: true, size: 255 },
      { key: "userId", type: "string", required: true, size: 255 },
      { key: "answer", type: "string", required: true, size: 1000 },
      { key: "submittedAt", type: "string", required: true, size: 50 },
    ],
  },
  services: {
    name: "services",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "name", type: "string", required: true, size: 255 },
      { key: "description", type: "string", required: true, size: 1000 },
      { key: "imageUrl", type: "string", required: false, size: 255 },
      { key: "createdBy", type: "string", required: true, size: 255 },
      { key: "createdAt", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
    ],
  },
  upcoming: {
    name: "upcoming",
    permissions: ['read("any")', 'write("any")'],
    attributes: [
      { key: "title", type: "string", required: true, size: 255 },
      { key: "description", type: "string", required: true, size: 1000 },
      { key: "date", type: "string", required: true, size: 50 },
      { key: "imageUrl", type: "string", required: false, size: 255 },
      { key: "createdBy", type: "string", required: true, size: 255 },
      { key: "createdAt", type: "string", required: true, size: 50 },
      { key: "isArchived", type: "boolean", required: true },
    ],
  },
};

async function migrateAll() {
  console.log("Starting migration process...");

  for (const [key, collection] of Object.entries(COLLECTIONS)) {
    console.log(`\nProcessing collection: ${key}`);

    try {
      // Delete existing collection if it exists
      try {
        await databases.deleteCollection(DATABASE_ID, collection.name);
        console.log(`Deleted existing collection ${collection.name}`);
      } catch (error) {
        // Collection might not exist, which is fine
      }

      // Create collection
      await databases.createCollection(
        DATABASE_ID,
        collection.name,
        collection.name,
        collection.permissions
      );
      console.log(`Created collection ${collection.name}`);

      // Create attributes
      for (const attr of collection.attributes) {
        try {
          if (attr.type === "string") {
            await databases.createStringAttribute(
              DATABASE_ID,
              collection.name,
              attr.key,
              attr.size || 255,
              attr.required,
              ""
            );
          } else if (attr.type === "boolean") {
            await databases.createBooleanAttribute(
              DATABASE_ID,
              collection.name,
              attr.key,
              attr.required,
              false
            );
          }
          console.log(`Created attribute ${attr.key} in ${collection.name}`);
        } catch (error) {
          console.log(`Error creating attribute ${attr.key}: ${error.message}`);
        }
      }

      // Import data if JSON file exists
      const jsonPath = `src/export_${key}.json`;
      if (fs.existsSync(jsonPath)) {
        console.log(`Importing data from ${jsonPath}`);
        const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

        for (const item of data) {
          try {
            // Create a new document with default values for required fields
            const document = {};

            // Add all attributes from the schema
            for (const attr of collection.attributes) {
              if (attr.type === "string") {
                document[attr.key] = item[attr.key] || "";
              } else if (attr.type === "boolean") {
                document[attr.key] = item[attr.key] || false;
              }
            }

            await databases.createDocument(
              DATABASE_ID,
              collection.name,
              ID.unique(),
              document
            );
          } catch (error) {
            console.log(`Error importing document: ${error}`);
          }
        }
      }
    } catch (error) {
      console.log(`Error processing collection ${key}: ${error.message}`);
    }

    console.log(`Completed processing ${key}`);
  }

  console.log("\nMigration completed successfully!");
}

// Run the migration
migrateAll().catch(console.error);
