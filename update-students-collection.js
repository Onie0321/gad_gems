const { Client, Databases } = require("node-appwrite");

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
const STUDENTS_COLLECTION_ID = "683e49c8000f1a45f34a";

// New attributes to add (excluding existing ones)
const newAttributes = [
  { key: "lastName", type: "string", required: false, size: 50 },
  { key: "firstName", type: "string", required: false, size: 50 },
  { key: "middleName", type: "string", required: false, size: 50 },
  { key: "program", type: "string", required: false, size: 50 },
  { key: "orientation", type: "string", required: false, size: 30 },
  { key: "religion", type: "string", required: false, size: 50 },
  { key: "firstGen", type: "string", required: false, size: 10 },
];

async function updateStudentsCollection() {
  try {
    console.log("Starting to update students collection...");

    for (const attr of newAttributes) {
      try {
        if (attr.type === "integer") {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            STUDENTS_COLLECTION_ID,
            attr.key,
            attr.required,
            attr.min,
            attr.max
          );
        } else {
          // Ensure size is a valid integer
          const size = parseInt(attr.size);
          if (isNaN(size) || size < 1) {
            console.error(`Invalid size value for ${attr.key}: ${attr.size}`);
            continue;
          }

          await databases.createStringAttribute(
            DATABASE_ID,
            STUDENTS_COLLECTION_ID,
            attr.key,
            attr.required,
            false, // array
            size, // size
            null // default
          );
        }
        console.log(`Successfully added attribute: ${attr.key}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`Attribute ${attr.key} already exists`);
        } else {
          console.error(`Error adding attribute ${attr.key}:`, error);
        }
      }
    }

    console.log("Finished updating students collection");
  } catch (error) {
    console.error("Error updating students collection:", error);
  }
}

// Run the update
updateStudentsCollection();
