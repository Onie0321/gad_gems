import fetch from "node-fetch";

const API_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "67d029d100075de4c69b";
const API_KEY =
  "standard_a4f21fc4b71d1a61b94e2c028cefb4d01d72bedf90e8e11c387e6555c4621b1f1aa39ae646d3130cd3a56af4e8d8bd93423a3d544bd6ac716e90b75b767bf39d8752f8bd19a4e8a1b3434d30e013c4d99db8959ad337cb68a7a048def2cb027bd8cac4fd81b82590cdad9c3cda5894437e66fd583d3504e78dfabdd3f479d06b";
const DATABASE_ID = "683e381500342320c476";
const COLLECTION_ID = "683e49c8000f1a45f34a";

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

async function createStringAttribute(key, required, size) {
  const url = `${API_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/string`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": PROJECT_ID,
      "X-Appwrite-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      required,
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

async function updateStudentsCollection() {
  try {
    console.log("Starting to update students collection...");

    for (const attr of newAttributes) {
      try {
        await createStringAttribute(attr.key, attr.required, attr.size);
        console.log(`Successfully added attribute: ${attr.key}`);
      } catch (error) {
        if (error.message.includes("already exists")) {
          console.log(`Attribute ${attr.key} already exists`);
        } else {
          console.error(`Error adding attribute ${attr.key}:`, error.message);
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
