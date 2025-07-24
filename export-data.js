const { Client, Databases, ID, Query } = require("node-appwrite");
const fs = require("fs");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("67d029d100075de4c69b")
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Database and collection IDs
const DATABASE_ID = "683e381500342320c476";
const COLLECTIONS = {
  users: "users",
  events: "events",
  students: "students",
};

async function exportData() {
  try {
    console.log("Starting data export...");

    // Export users
    if (fs.existsSync("src/export_users.json")) {
      console.log("Exporting users...");
      const usersData = JSON.parse(
        fs.readFileSync("src/export_users.json", "utf8")
      );

      for (const user of usersData) {
        try {
          // Create user document
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.users,
            ID.unique(),
            {
              accountId: user.accountId,
              email: user.email,
              name: user.name,
              role: user.role,
              approvalStatus: user.approvalStatus,
              isFirstLogin: true,
              password: "", // Password will be set by the user on first login
            }
          );
          console.log(`User ${user.email} exported successfully`);
        } catch (error) {
          if (error.code === 409) {
            console.log(`User ${user.email} already exists`);
          } else {
            console.error(`Error exporting user ${user.email}:`, error);
          }
        }
      }
    }

    // Export events
    if (fs.existsSync("src/export_events.json")) {
      console.log("Exporting events...");
      const eventsData = JSON.parse(
        fs.readFileSync("src/export_events.json", "utf8")
      );

      for (const event of eventsData) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.events,
            ID.unique(),
            {
              eventName: event.eventName,
              eventDate: event.eventDate,
              eventTimeFrom: event.eventTimeFrom,
              eventTimeTo: event.eventTimeTo,
              eventVenue: event.eventVenue,
              eventType: event.eventType,
              eventCategory: event.eventCategory,
              numberOfHours: event.numberOfHours,
              createdBy: event.createdBy,
              isArchived: event.isArchived || false,
              academicPeriodId: event.academicPeriodId,
            }
          );
          console.log(`Event ${event.eventName} exported successfully`);
        } catch (error) {
          if (error.code === 409) {
            console.log(`Event ${event.eventName} already exists`);
          } else {
            console.error(`Error exporting event ${event.eventName}:`, error);
          }
        }
      }
    }

    // Export students
    if (fs.existsSync("src/export_students.json")) {
      console.log("Exporting students...");
      const studentsData = JSON.parse(
        fs.readFileSync("src/export_students.json", "utf8")
      );

      for (const student of studentsData) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.students,
            ID.unique(),
            {
              eventId: student.eventId,
              name: student.name,
              sex: student.sex,
              age: student.age,
              address: student.address,
              createdBy: student.createdBy,
              isArchived: student.isArchived || false,
              academicPeriodId: student.academicPeriodId,
            }
          );
          console.log(`Student ${student.name} exported successfully`);
        } catch (error) {
          if (error.code === 409) {
            console.log(`Student ${student.name} already exists`);
          } else {
            console.error(`Error exporting student ${student.name}:`, error);
          }
        }
      }
    }

    console.log("Data export completed successfully!");
  } catch (error) {
    console.error("Data export failed:", error);
    throw error;
  }
}

// Run the export
exportData().catch(console.error);
