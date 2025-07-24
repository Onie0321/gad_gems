// recreate-schema-from-exports.js
// Script to recreate Appwrite collections and attributes (schema only, no data) in a new project/database from export_*.json files.
// Usage: node recreate-schema-from-exports.js

const sdk = require("node-appwrite");
const fs = require("fs");
const path = require("path");

// ====== CONFIGURATION ======
const APPWRITE_ENDPOINT = "https://syd.cloud.appwrite.io/v1";
const PROJECT_ID = "686d14cb001ff8a18f19";
const DATABASE_ID = "686d1515003130afaebe";
const API_KEY =
  "standard_0938f6740eae1985dd21f3786d3852685c0e94ca5f8092f7b3fd048ed66c3d22f4763db896fe885ddeb2eaf9e862afad7eee1b95023d964c1cc14b4779d931ac0a3e5cbe089b22f0ea1267f14c2448a53fd26d9fe75ec88f6410bcd47bfc3a52a46527bf5f12cb4c7e10cf60f831f2a0edcc47ebed758e8c2e3ffaf7a4c3562f";
const EXPORTS_DIR = path.join(__dirname, "src");

// ====== SETUP APPWRITE CLIENT ======
const client = new sdk.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);
const db = new sdk.Databases(client);

// ====== TYPE INFERENCE UTILS ======
function inferType(value) {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number")
    return Number.isInteger(value) ? "integer" : "float";
  if (typeof value === "string") {
    // Check for ISO date
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return "datetime";
    if (/^\S+@\S+\.\S+$/.test(value)) return "email";
    if (/^https?:\/\//.test(value)) return "url";
    return "string";
  }
  if (Array.isArray(value)) return "array";
  if (value === null) return "string"; // treat null as string (optional)
  return "string";
}

function mergeTypes(typeA, typeB) {
  if (typeA === typeB) return typeA;
  if (
    (typeA === "integer" && typeB === "float") ||
    (typeA === "float" && typeB === "integer")
  )
    return "float";
  // fallback to string for mixed types
  return "string";
}

// ====== STUDENTS SCHEMA FROM MIGRATE-STUDENTS.JS ======
async function updateStudentsSchemaToMigrateSchema() {
  // The schema as defined in migrate-students.js
  const studentsAttributes = [
    { key: "studentId", type: "string", required: true },
    { key: "lastName", type: "string", required: true },
    { key: "firstName", type: "string", required: true },
    { key: "middleName", type: "string", required: false },
    { key: "school", type: "string", required: true },
    { key: "year", type: "string", required: true },
    { key: "age", type: "string", required: true },
    { key: "sex", type: "string", required: true },
    { key: "orientation", type: "string", required: false },
    { key: "religion", type: "string", required: false },
    { key: "address", type: "string", required: true },
    { key: "ethnicGroup", type: "string", required: false },
    { key: "firstGen", type: "string", required: false },
    { key: "createdBy", type: "string", required: true },
    { key: "isArchived", type: "boolean", required: false, default: false },
    { key: "academicPeriodId", type: "string", required: false },
    { key: "eventId", type: "string", required: false },
    { key: "section", type: "string", required: false },
  ];

  // Find the students collection (by name)
  let studentsCollection = null;
  try {
    const collections = await db.listCollections(DATABASE_ID);
    studentsCollection = collections.collections.find(
      (col) => col.name.toLowerCase() === "students"
    );
    if (!studentsCollection) {
      console.error(
        "❌ Could not find a collection named 'students'. Please create it first or provide its ID."
      );
      return;
    }
  } catch (err) {
    console.error("❌ Error fetching collections:", err.message);
    return;
  }
  const studentsCollectionId = studentsCollection.$id;
  console.log(
    `\nUpdating 'students' collection schema (ID: ${studentsCollectionId})...`
  );

  for (const attr of studentsAttributes) {
    try {
      // Check if attribute already exists
      let exists = false;
      let existingAttr = null;
      try {
        existingAttr = await db.getAttribute(
          DATABASE_ID,
          studentsCollectionId,
          attr.key
        );
        exists = true;
      } catch (e) {
        exists = false;
      }
      if (exists) {
        // Special handling for 'age': check type
        if (attr.key === "age" && existingAttr.type !== "string") {
          console.error(
            `  Attribute 'age' exists but is type '${existingAttr.type}'. Appwrite does not support changing attribute types. Please delete the 'age' attribute in the Appwrite console and re-run this script to recreate it as a string.`
          );
        } else {
          console.log(`  Attribute '${attr.key}' already exists.`);
        }
        continue;
      }
      if (attr.type === "string") {
        await db.createStringAttribute(
          DATABASE_ID,
          studentsCollectionId,
          attr.key,
          255, // Use 255 as a reasonable default size
          attr.required,
          attr.default
        );
      } else if (attr.type === "boolean") {
        await db.createBooleanAttribute(
          DATABASE_ID,
          studentsCollectionId,
          attr.key,
          attr.required,
          attr.default
        );
      }
      console.log(`  Created attribute: ${attr.key} (${attr.type})`);
    } catch (err) {
      if (err.code === 409) {
        console.log(`  Attribute '${attr.key}' already exists.`);
      } else {
        console.error(`  Error creating attribute '${attr.key}':`, err.message);
      }
    }
  }
  console.log("'students' collection schema update complete!\n");
}
//
// ====== MAIN SCRIPT ======
(async () => {
  try {
    // Only update the students collection schema
    await updateStudentsSchemaToMigrateSchema();
  } catch (err) {
    console.error("Schema update failed:", err);
  }
})();

// ====== NOTES ======
// - This script infers attribute types from the data. Review and adjust as needed for production.
// - Only collections/attributes present in export_*.json files will be recreated.
// - No data/documents are imported.
// - Test on a staging environment before running on production.
