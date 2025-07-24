// Load environment variables
require("dotenv").config();

const { Client, Databases, ID } = require("node-appwrite");
const XLSX = require("xlsx");
const fs = require("fs");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Configuration
const databaseId = "686d1515003130afaebe";
const targetCollectionId = "686d206a0021a80fefda";
const excelFilePath = "public/Student Data 24-2- request of GAD (1).xlsx";

async function importExcelToCollection() {
  try {
    console.log("📊 Starting Excel import to collection...");
    console.log("Database ID:", databaseId);
    console.log("Target Collection ID:", targetCollectionId);
    console.log("Excel File:", excelFilePath);
    console.log("");

    // Check if file exists
    if (!fs.existsSync(excelFilePath)) {
      console.error("❌ Excel file not found:", excelFilePath);
      return;
    }

    // Read Excel file
    console.log("1. Reading Excel file...");
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0]; // Get first sheet
    const worksheet = workbook.Sheets[sheetName];

    // Start reading from row 8 (0-indexed row 7) where headers begin
    const data = XLSX.utils.sheet_to_json(worksheet, { range: 7 });

    console.log(`✅ Excel file read successfully`);
    console.log(`   Sheet: ${sheetName}`);
    console.log(`   Rows: ${data.length}`);
    console.log("");

    if (data.length === 0) {
      console.log("❌ No data found in Excel file");
      return;
    }

    // Show sample data structure
    console.log("2. Sample data structure:");
    const sampleRow = data[0];
    Object.keys(sampleRow).forEach((key) => {
      console.log(`   - ${key}: ${sampleRow[key]}`);
    });
    console.log("");

    // Import data to collection
    console.log("3. Importing data to collection...");
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Batch size for parallel requests
    const BATCH_SIZE = 10;
    for (
      let batchStart = 0;
      batchStart < data.length;
      batchStart += BATCH_SIZE
    ) {
      const batch = data.slice(batchStart, batchStart + BATCH_SIZE);
      const promises = batch.map((row, i) => {
        // Clean and prepare the data
        const documentData = {
          name: `${row["First Name"] || ""} ${(row["Middle Name"] || "").charAt(
            0
          )}. ${row["Last Name"] || ""}`.trim(),
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
          ethnicGroup: row["Indigenous People"] || "",
          firstGen: row["First Generation Student"] || "",
          school: "",
          createdBy: "Daniel Vetriolo",
          source: "import",
          isArchived: false,
          academicPeriodId: "",
          eventId: "",
          section: "",
          otherEthnicGroup: "",
          participantType: "Student",
        };
        return databases.createDocument(
          databaseId,
          targetCollectionId,
          ID.unique(),
          documentData
        );
      });
      // Wait for all in the batch to finish
      const results = await Promise.allSettled(promises);
      results.forEach((result, idx) => {
        const rowIndex = batchStart + idx;
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          errorCount++;
          errors.push({
            row: rowIndex + 1,
            data: data[rowIndex],
            error: result.reason.message,
          });
          console.error(
            `   ❌ Error importing row ${rowIndex + 1}:`,
            result.reason.message
          );
        }
      });
      if (
        (batchStart + BATCH_SIZE) % 500 === 0 ||
        batchStart + BATCH_SIZE >= data.length
      ) {
        console.log(
          `   ✅ Imported ${Math.min(batchStart + BATCH_SIZE, data.length)}/${
            data.length
          } records`
        );
      }
    }

    // Summary
    console.log("\n4. Import Summary:");
    console.log(`✅ Successfully imported: ${successCount} records`);
    console.log(`❌ Failed imports: ${errorCount} records`);

    if (errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      errors.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. Row ${error.row}: ${error.error}`);
      });
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more errors`);
      }
    }

    console.log("\n🎉 Import completed!");
    console.log(`📊 Total records processed: ${data.length}`);
    console.log(`📊 Successfully imported: ${successCount}`);
    console.log(`📊 Failed imports: ${errorCount}`);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

// Run the import
importExcelToCollection();
