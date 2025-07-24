// clone-appwrite-schema.js
// Script to clone all collections and their attributes (schema only, no data) from an old Appwrite database to a new one.
// Usage: node clone-appwrite-schema.js

const sdk = require("node-appwrite");

// ====== CONFIGURATION ======
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1"; // Change if needed

// Old (source) database
const OLD_PROJECT_ID = "<YOUR_OLD_PROJECT_ID>"; // Fill in your old project ID
const OLD_DB_ID = "683e381500342320c476";
const OLD_API_KEY =
  "standard_5d32a361affff9d5c9f3a55c3d257d7f05c6a1d6cb6b00d1d788bd04c4355f43d339cb8d104cbc1c11de7b2abbc904a278724da63fcf853adffa784cd3ec3829256693be4afa73772e89e694cc197d39a334e8803f6dc1ad586480f21d0f8c211120f2314f4e049b23364ad4a57a47b499fb6d073b787217cd7788ce232db488";

// New (target) database
const NEW_PROJECT_ID = "686d14cb001ff8a18f19";
const NEW_DB_ID = "686d1515003130afaebe";
const NEW_API_KEY =
  "standard_0938f6740eae1985dd21f3786d3852685c0e94ca5f8092f7b3fd048ed66c3d22f4763db896fe885ddeb2eaf9e862afad7eee1b95023d964c1cc14b4779d931ac0a3e5cbe089b22f0ea1267f14c2448a53fd26d9fe75ec88f6410bcd47bfc3a52a46527bf5f12cb4c7e10cf60f831f2a0edcc47ebed758e8c2e3ffaf7a4c3562f";

// ====== SETUP APPWRITE CLIENTS ======
const oldClient = new sdk.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(OLD_PROJECT_ID)
  .setKey(OLD_API_KEY);

const newClient = new sdk.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(NEW_PROJECT_ID)
  .setKey(NEW_API_KEY);

const oldDB = new sdk.Databases(oldClient);
const newDB = new sdk.Databases(newClient);

// ====== CLONE SCHEMA SCRIPT ======
(async () => {
  try {
    console.log("Fetching collections from old database...");
    const collections = await oldDB.listCollections(OLD_DB_ID);
    if (!collections.total) {
      console.log("No collections found in old database.");
      return;
    }
    console.log(`Found ${collections.total} collections.`);

    for (const collection of collections.collections) {
      const {
        $id: oldColId,
        name,
        permissions,
        documentSecurity,
        enabled,
      } = collection;
      console.log(`\nCloning collection: ${name} (ID: ${oldColId})`);

      // 1. Create collection in new DB
      let newCol;
      try {
        newCol = await newDB.createCollection(
          NEW_DB_ID,
          oldColId, // Use same collection ID for 1:1 mapping
          name,
          permissions,
          documentSecurity,
          enabled
        );
        console.log(`  Created collection in new DB: ${name}`);
      } catch (err) {
        if (err.code === 409) {
          // Collection already exists
          newCol = await newDB.getCollection(NEW_DB_ID, oldColId);
          console.log("  Collection already exists in new DB, using existing.");
        } else {
          throw err;
        }
      }

      // 2. Clone attributes
      console.log("  Fetching attributes...");
      const attributes = await oldDB.listAttributes(OLD_DB_ID, oldColId);
      for (const attr of attributes.attributes) {
        try {
          // Only create if not already present
          let exists = false;
          try {
            await newDB.getAttribute(NEW_DB_ID, oldColId, attr.key);
            exists = true;
          } catch (e) {
            exists = false;
          }
          if (exists) {
            console.log(`    Attribute '${attr.key}' already exists.`);
            continue;
          }

          // Create attribute based on type
          switch (attr.type) {
            case "string":
              await newDB.createStringAttribute(
                NEW_DB_ID,
                oldColId,
                attr.key,
                attr.size,
                attr.required,
                attr.default,
                attr.array,
                attr.encrypt
              );
              break;
            case "integer":
              await newDB.createIntegerAttribute(
                NEW_DB_ID,
                oldColId,
                attr.key,
                attr.required,
                attr.min,
                attr.max,
                attr.default,
                attr.array
              );
              break;
            case "float":
              await newDB.createFloatAttribute(
                NEW_DB_ID,
                oldColId,
                attr.key,
                attr.required,
                attr.min,
                attr.max,
                attr.default,
                attr.array
              );
              break;
            case "boolean":
              await newDB.createBooleanAttribute(
                NEW_DB_ID,
                oldColId,
                attr.key,
                attr.required,
                attr.default,
                attr.array
              );
              break;
            case "datetime":
              await newDB.createDatetimeAttribute(
                NEW_DB_ID,
                oldColId,
                attr.key,
                attr.required,
                attr.default,
                attr.array
              );
              break;
            case "email":
              await newDB.createEmailAttribute(
                NEW_DB_ID,
                oldColId,
                attr.key,
                attr.required,
                attr.default,
                attr.array
              );
              break;
            case "enum":
              await newDB.createEnumAttribute(
                NEW_DB_ID,
                oldColId,
                attr.key,
                attr.elements,
                attr.required,
                attr.default,
                attr.array
              );
              break;
            case "ip":
              await newDB.createIpAttribute(
                NEW_DB_ID,
                oldColId,
                attr.key,
                attr.required,
                attr.default,
                attr.array
              );
              break;
            case "url":
              await newDB.createUrlAttribute(
                NEW_DB_ID,
                oldColId,
                attr.key,
                attr.required,
                attr.default,
                attr.array
              );
              break;
            case "relationship":
              await newDB.createRelationshipAttribute(
                NEW_DB_ID,
                oldColId,
                attr.relatedCollection,
                attr.relationType,
                attr.twoWay,
                attr.key,
                attr.twoWayKey,
                attr.onDelete
              );
              break;
            default:
              console.warn(
                `    Skipping unsupported attribute type: ${attr.type}`
              );
          }
          console.log(`    Created attribute: ${attr.key} (${attr.type})`);
        } catch (err) {
          if (err.code === 409) {
            console.log(`    Attribute '${attr.key}' already exists.`);
          } else {
            console.error(
              `    Error creating attribute '${attr.key}':`,
              err.message
            );
          }
        }
      }

      // 3. Clone indexes
      console.log("  Fetching indexes...");
      const indexes = await oldDB.listIndexes(OLD_DB_ID, oldColId);
      for (const idx of indexes.indexes) {
        try {
          await newDB.createIndex(
            NEW_DB_ID,
            oldColId,
            idx.key,
            idx.type,
            idx.attributes,
            idx.orders,
            idx.lengths
          );
          console.log(`    Created index: ${idx.key}`);
        } catch (err) {
          if (err.code === 409) {
            console.log(`    Index '${idx.key}' already exists.`);
          } else {
            console.error(
              `    Error creating index '${idx.key}':`,
              err.message
            );
          }
        }
      }
    }
    console.log("\nSchema clone complete!");
  } catch (err) {
    console.error("Schema clone failed:", err);
  }
})();

// ====== NOTES ======
// - Fill in <YOUR_OLD_PROJECT_ID> at the top of this script.
// - This script clones only the schema (collections, attributes, indexes), not the data.
// - Relationship attributes are cloned, but check for cross-collection dependencies.
// - Test on a staging environment before running on production.
