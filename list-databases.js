const { Client, Databases } = require("node-appwrite");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("67d029d100075de4c69b")
  .setKey(
    "standard_a4f21fc4b71d1a61b94e2c028cefb4d01d72bedf90e8e11c387e6555c4621b1f1aa39ae646d3130cd3a56af4e8d8bd93423a3d544bd6ac716e90b75b767bf39d8752f8bd19a4e8a1b3434d30e013c4d99db8959ad337cb68a7a048def2cb027bd8cac4fd81b82590cdad9c3cda5894437e66fd583d3504e78dfabdd3f479d06b"
  );

const databases = new Databases(client);

async function listDatabases() {
  try {
    console.log("Listing all databases...\n");
    const response = await databases.list();
    console.log("Found databases:");
    response.databases.forEach((db) => {
      console.log(`- ID: ${db.$id}`);
      console.log(`  Name: ${db.name}`);
      console.log(`  Created: ${db.$createdAt}`);
      console.log();
    });
  } catch (error) {
    console.error("Error listing databases:", error);
  }
}

listDatabases().catch(console.error);
