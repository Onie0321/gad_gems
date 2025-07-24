require("dotenv").config();
const { Client, Databases, ID } = require("node-appwrite");
const fs = require("fs");

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const databaseId = "686d1515003130afaebe";
const targetCollectionId = "686d206a0021a80fefda";
const failedRowsFile = "failed-imports.json"; // Save your errors array here

async function importFailedRows() {
  if (!fs.existsSync(failedRowsFile)) {
    console.error("No failed-imports.json file found.");
    return;
  }
  const errors = JSON.parse(fs.readFileSync(failedRowsFile, "utf8"));
  let successCount = 0, errorCount = 0;
  for (const error of errors) {
    const row = error.data;
    // Prepare documentData as in your main script
    const documentData = {
      name: `${row["First Name"] || ""} ${(row["Middle Name"] || "").charAt(0)}. ${row["Last Name"] || ""}`.trim(),
      studentId: row["Student Number"]?.toString() || "",
      lastName: row["Last Name"] || "",
      firstName: row["First Name"] || "",
      middleName: row["Middle Name"] || "",
      program: row["Program"] || "",
      year: row["Year Level"]?.toString() || "",
      age: row["Age"]?.toString() || "",
      sex: row["Gender"] || "",
      orientation: row["Sexual Orientation"] || "",
      religion: row["Religion"] || "",
      address: row["Residential Address"] || "",
      ethnicGroup: (row["Indigenous People"] || "").toString().slice(0, 500),
      firstGen: row["First Generation Student"] || "",
      school: "",
      createdBy: "Daniel Vetriolo",
      source: "import",
      isArchived: false,
      academicPeriodId: "",
      eventId: "",
      section: "",
      otherEthnicGroup: "",
      participantType: "",
    };
    try {
      await databases.createDocument(
        databaseId,
        targetCollectionId,
        ID.unique(),
        documentData
      );
      console.log(`✅ Imported failed row: ${error.row}`);
      successCount++;
    } catch (err) {
      console.error(`❌ Still failed row: ${error.row} - ${err.message}`);
      errorCount++;
    }
  }
  console.log(`Done! Successfully imported: ${successCount}, Still failed: ${errorCount}`);
}

importFailedRows();