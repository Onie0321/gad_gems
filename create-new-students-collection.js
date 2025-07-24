import fetch from "node-fetch";

const API_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "67d029d100075de4c69b";
const API_KEY =
  "standard_a4f21fc4b71d1a61b94e2c028cefb4d01d72bedf90e8e11c387e6555c4621b1f1aa39ae646d3130cd3a56af4e8d8bd93423a3d544bd6ac716e90b75b767bf39d8752f8bd19a4e8a1b3434d30e013c4d99db8959ad337cb68a7a048def2cb027bd8cac4fd81b82590cdad9c3cda5894437e66fd583d3504e78dfabdd3f479d06b";
const DATABASE_ID = "683e381500342320c476";

async function createCollection() {
  const url = `${API_ENDPOINT}/databases/${DATABASE_ID}/collections`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": PROJECT_ID,
      "X-Appwrite-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      collectionId: "students_new",
      name: "Students New",
      permissions: ['read("any")', 'write("any")'],
      documentSecurity: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create collection: ${error.message}`);
  }

  return response.json();
}

async function createStringAttribute(collectionId, key, required, size) {
  const url = `${API_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/attributes/string`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": PROJECT_ID,
      "X-Appwrite-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      required: false, // Make all attributes optional
      size,
      array: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create attribute ${key}: ${error.message}`);
  }

  return response.json();
}

async function setupNewCollection() {
  try {
    console.log("Creating new students collection...");
    const collection = await createCollection();
    console.log("Collection created successfully!");

    const attributes = [
      { key: "studentId", size: 50 },
      { key: "lastName", size: 50 },
      { key: "firstName", size: 50 },
      { key: "middleName", size: 50 },
      { key: "school", size: 50 },
      { key: "year", size: 10 },
      { key: "age", size: 10 },
      { key: "gender", size: 20 },
      { key: "orientation", size: 30 },
      { key: "religion", size: 50 },
      { key: "address", size: 200 },
      { key: "ethnicGroup", size: 50 },
      { key: "firstGen", size: 10 },
    ];

    console.log("Creating attributes...");
    for (const attr of attributes) {
      try {
        await createStringAttribute(collection.$id, attr.key, false, attr.size);
        console.log(`Created attribute: ${attr.key}`);
      } catch (error) {
        console.error(`Error creating attribute ${attr.key}:`, error.message);
      }
    }

    console.log("Collection setup completed!");
    console.log("Collection ID:", collection.$id);
  } catch (error) {
    console.error("Error setting up collection:", error);
  }
}

// Run the setup
setupNewCollection();
