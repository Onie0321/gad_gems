const sdk = require("node-appwrite");
const fs = require("fs");

const client = new sdk.Client();
const database = new sdk.Databases(client);

client
  .setEndpoint("https://cloud.appwrite.io/v1") // Appwrite Endpoint
  .setProject("670e7a740019d9d38739") // Replace with your project ID
  .setKey("standard_0b5298ea8c23191cac1a9314ff13af2088d65d76fc10bbb29e3852be0a368045b340bc252b24e0f909903046136e20c7216f8ac392c660656c122e558f3cba972fb1ed9924a5478d93991e8616ccb0887c2be6fb18fe6eaffc952da2181a3b431a2346414ff1132b5ccf8a6535978640d5b3f03c204cb5f70a9e812221b512e1"); // Replace with your API Key

const DATABASE_ID = "670e7b65002731de2383"; // Replace with your database ID

async function exportAllCollections() {
  try {
    // Fetch all collections under the database
    const collections = await database.listCollections(DATABASE_ID);

    for (const collection of collections.collections) {
      console.log(`Exporting collection: ${collection.$id}`);

      // Fetch all documents in the collection
      const documents = await database.listDocuments(DATABASE_ID, collection.$id);

      // Save data as JSON
      fs.writeFileSync(
        `export_${collection.name}.json`,
        JSON.stringify(documents.documents, null, 2)
      );

      console.log(`✅ Exported: ${collection.name} (${documents.documents.length} documents)`);
    }

    console.log("🎉 All collections exported successfully!");
  } catch (error) {
    console.error("❌ Error exporting collections:", error);
  }
}

exportAllCollections();
