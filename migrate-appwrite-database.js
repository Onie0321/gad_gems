// migrate-appwrite-database.js
// Standalone script to migrate all collections, attributes, and documents from one Appwrite database to another.
// Usage: node migrate-appwrite-database.js

const sdk = require("node-appwrite");

// ====== CONFIGURATION ======
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1"; // Change if needed
const APPWRITE_PROJECT_ID = "67d029d100075de4c69b"; // Fill in your project ID

const OLD_DB_ID = "683e381500342320c476";
const NEW_DB_ID = "686d068000357e08f47e";

const OLD_API_KEY =
  "standard_5d32a361affff9d5c9f3a55c3d257d7f05c6a1d6cb6b00d1d788bd04c4355f43d339cb8d104cbc1c11de7b2abbc904a278724da63fcf853adffa784cd3ec3829256693be4afa73772e89e694cc197d39a334e8803f6dc1ad586480f21d0f8c211120f2314f4e049b23364ad4a57a47b499fb6d073b787217cd7788ce232db488";
const NEW_API_KEY =
  "standard_b9017ccb1758d03a286945835f085691173f3fc4d769176bbf3ea86e81ecca6fcaa7cebc553cdd003565fd25c0050800b59de3431ac40c9f184304fdd53e4e3a0d86073a2674ef076a30836e7d68d9a321223cb0685403b4d68cdc9be290a9f5ebf0276617a2315d6676a4cf5a9fcc14f7f12af88fdad7301ff8d1205581ea84";

// ====== SETUP APPWRITE CLIENTS ======
const oldClient = new sdk.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(OLD_API_KEY);

const newClient = new sdk.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(NEW_API_KEY);

const oldDB = new sdk.Databases(oldClient);
const newDB = new sdk.Databases(newClient);
const ID = sdk.ID;
const Query = sdk.Query;

// ====== MIGRATION SCRIPT ======
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
      console.log(`\nMigrating collection: ${name} (ID: ${oldColId})`);

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

      // 2. Migrate attributes
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

      // 3. Migrate indexes
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

      // 4. Migrate documents
      console.log("  Migrating documents...");
      let totalDocs = 0;
      let lastDocId = null;
      const batchSize = 100;
      while (true) {
        const queries = [Query.limit(batchSize)];
        if (lastDocId) queries.push(Query.cursorAfter(lastDocId));
        const docs = await oldDB.listDocuments(OLD_DB_ID, oldColId, queries);
        if (!docs.documents.length) break;
        for (const doc of docs.documents) {
          try {
            // Remove system fields
            const {
              $id,
              $permissions,
              $createdAt,
              $updatedAt,
              $collectionId,
              $databaseId,
              ...data
            } = doc;
            await newDB.createDocument(
              NEW_DB_ID,
              oldColId,
              $id, // preserve document ID
              data,
              doc.$permissions
            );
            totalDocs++;
            if (totalDocs % 50 === 0)
              console.log(`    Migrated ${totalDocs} documents so far...`);
          } catch (err) {
            if (err.code === 409) {
              console.log(`    Document '${doc.$id}' already exists.`);
            } else {
              console.error(
                `    Error migrating document '${doc.$id}':`,
                err.message
              );
            }
          }
        }
        lastDocId = docs.documents[docs.documents.length - 1].$id;
        if (docs.documents.length < batchSize) break;
      }
      console.log(
        `  Finished migrating collection '${name}'. Total documents: ${totalDocs}`
      );
    }
    console.log("\nMigration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
})();

// ====== NOTES ======
// - Fill in <YOUR_PROJECT_ID> at the top of this script.
// - This script assumes both databases are in the same Appwrite project.
// - Relationship attributes are migrated, but you may need to check for cross-collection dependencies.
// - For large datasets, consider rate limits and batching.
// - Test on a staging environment before running on production.
