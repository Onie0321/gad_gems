const { Client, Databases } = require("node-appwrite");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://syd.cloud.appwrite.io/v1")
  .setProject("686d14cb001ff8a18f19")
  .setKey(
    "standard_0938f6740eae1985dd21f3786d3852685c0e94ca5f8092f7b3fd048ed66c3d22f4763db896fe885ddeb2eaf9e862afad7eee1b95023d964c1cc14b4779d931ac0a3e5cbe089b22f0ea1267f14c2448a53fd26d9fe75ec88f6410bcd47bfc3a52a46527bf5f12cb4c7e10cf60f831f2a0edcc47ebed758e8c2e3ffaf7a4c3562f"
  );

const databases = new Databases(client);
const DATABASE_ID = "686d1515003130afaebe";

async function listCollections() {
  try {
    console.log("Listing all collections...\n");
    const response = await databases.listCollections(DATABASE_ID);
    console.log("Collections:");
    response.collections.forEach((collection) => {
      console.log(`Name: ${collection.name}, ID: ${collection.$id}`);
    });
  } catch (error) {
    console.error("Error listing collections:", error);
  }
}

listCollections();
