const { Client, Databases, Query } = require("node-appwrite");

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
const COLLECTIONS = {
  users: "users",
  events: "events",
  students: "students",
};

async function verifyImport() {
  try {
    console.log("Verifying imported data...\n");

    // First, verify the database exists
    try {
      const database = await databases.get(DATABASE_ID);
      console.log(`Database "${database.name}" exists\n`);
    } catch (error) {
      console.error("Database not found:", error);
      return;
    }

    // Check users collection
    console.log("Checking users collection...");
    try {
      const users = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.users
      );
      console.log(`Found ${users.total} users:`);
      users.documents.forEach((user) => {
        console.log(
          `- ${user.name} (${user.email}) - Role: ${user.role}, Status: ${user.approvalStatus}`
        );
      });
    } catch (error) {
      console.error("Error checking users collection:", error);
    }
    console.log();

    // Check events collection
    console.log("Checking events collection...");
    try {
      const events = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.events
      );
      console.log(`Found ${events.total} events:`);
      events.documents.forEach((event) => {
        console.log(
          `- ${event.eventName} (${event.eventDate}) - Venue: ${event.eventVenue}`
        );
      });
    } catch (error) {
      console.error("Error checking events collection:", error);
    }
    console.log();

    // Check students collection
    console.log("Checking students collection...");
    try {
      const students = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.students
      );
      console.log(`Found ${students.total} students:`);
      students.documents.forEach((student) => {
        console.log(
          `- ${student.name} - Age: ${student.age}, Event ID: ${student.eventId}`
        );
      });
    } catch (error) {
      console.error("Error checking students collection:", error);
    }

    console.log("\nVerification completed!");
  } catch (error) {
    console.error("Verification failed:", error);
    throw error;
  }
}

// Run the verification
verifyImport().catch(console.error);
