import fetch from "node-fetch";
import xlsx from "xlsx";
import { existsSync } from "fs";

// ====== CONFIGURATION ======
const API_ENDPOINT = "https://syd.cloud.appwrite.io/v1"; // Update if your endpoint is region-specific
const PROJECT_ID = "686d14cb001ff8a18f19";
const API_KEY =
  "standard_0938f6740eae1985dd21f3786d3852685c0e94ca5f8092f7b3fd048ed66c3d22f4763db896fe885ddeb2eaf9e862afad7eee1b95023d964c1cc14b4779d931ac0a3e5cbe089b22f0ea1267f14c2448a53fd26d9fe75ec88f6410bcd47bfc3a52a46527bf5f12cb4c7e10cf60f831f2a0edcc47ebed758e8c2e3ffaf7a4c3562f";
const DATABASE_ID = "686d1515003130afaebe";
const STUDENTS_COLLECTION_NAME = "students";
const BATCH_SIZE = 500;

// ====== HELPERS ======
async function getStudentsCollectionId() {
  // Use Appwrite REST API to list collections and find the students collection
  const url = `${API_ENDPOINT}/databases/${DATABASE_ID}/collections`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Appwrite-Project": PROJECT_ID,
      "X-Appwrite-Key": API_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to list collections: ${(await response.json()).message}`
    );
  }
  const data = await response.json();
  const studentsCol = data.collections.find(
    (col) => col.name.toLowerCase() === STUDENTS_COLLECTION_NAME
  );
  if (!studentsCol)
    throw new Error("Could not find 'students' collection in the database.");
  return studentsCol.$id;
}

async function createDocument(collectionId, data) {
  const url = `${API_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": PROJECT_ID,
      "X-Appwrite-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId: "unique()",
      data,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create document: ${error.message}`);
  }
  return response.json();
}

// ====== MAIN IMPORT FUNCTION ======
async function importStudentsFromExcel(excelFilePath) {
  try {
    if (!existsSync(excelFilePath)) {
      console.error(`Excel file not found: ${excelFilePath}`);
      process.exit(1);
    }
    const studentsCollectionId = await getStudentsCollectionId();
    console.log("Reading Excel file...");
    const workbook = xlsx.readFile(excelFilePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    // Read all rows as arrays
    const allRows = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    });
    // Find the header row (try to find the row with 'studentId' or 'lastName')
    let headerRowIdx = allRows.findIndex(
      (row) => row.includes("studentId") || row.includes("lastName")
    );
    if (headerRowIdx === -1) headerRowIdx = 0;
    const headers = allRows[headerRowIdx];
    const dataRows = allRows
      .slice(headerRowIdx + 1)
      .filter((row) => row.some((cell) => cell !== ""));

    // Map each row to the canonical students schema
    // Canonical schema from migrate-students.js:
    // studentId, lastName, firstName, middleName, school, year, age, sex, orientation, religion, address, ethnicGroup, firstGen, createdBy, isArchived, academicPeriodId, eventId, section
    const canonicalKeys = [
      "studentId",
      "lastName",
      "firstName",
      "middleName",
      "school",
      "year",
      "age",
      "sex",
      "orientation",
      "religion",
      "address",
      "ethnicGroup",
      "firstGen",
      "createdBy",
      "isArchived",
      "academicPeriodId",
      "eventId",
      "section",
    ];
    // Build a mapping from header to canonical key (case-insensitive)
    const headerMap = {};
    for (const key of canonicalKeys) {
      const idx = headers.findIndex(
        (h) => h && h.toLowerCase() === key.toLowerCase()
      );
      if (idx !== -1) headerMap[key] = idx;
    }
    // Default values for missing fields
    const defaultValues = {
      createdBy: "import-script",
      isArchived: false,
    };
    const data = dataRows.map((row) => {
      const obj = {};
      for (const key of canonicalKeys) {
        if (headerMap[key] !== undefined) {
          let value = row[headerMap[key]];
          // Change: Import 'age' as a string, not integer
          if (key === "age") {
            obj[key] =
              value === undefined || value === null ? "" : String(value).trim();
          } else {
            obj[key] = value;
          }
        } else if (defaultValues[key] !== undefined) {
          obj[key] = defaultValues[key];
        } else {
          obj[key] = "";
        }
      }
      return obj;
    });
    console.log(`Found ${data.length} records to import`);
    // Process in batches
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
          data.length / BATCH_SIZE
        )}`
      );
      for (const studentData of batch) {
        try {
          await createDocument(studentsCollectionId, studentData);
          process.stdout.write(".");
        } catch (error) {
          console.error(`\nError importing record:`, error.message);
        }
      }
      console.log(`\nCompleted batch ${Math.floor(i / BATCH_SIZE) + 1}`);
    }
    console.log("\nImport completed successfully!");
  } catch (error) {
    console.error("Error during import:", error);
  }
}

// ====== ENTRY POINT ======
const excelFilePath =
  process.argv[2] || "public/Student Data 24-2- request of GAD (1).xlsx";
importStudentsFromExcel(excelFilePath);
