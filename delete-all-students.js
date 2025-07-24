const { Client, Databases } = require("node-appwrite");

// Appwrite credentials (from update-students-collection.js)
const client = new Client()
  .setEndpoint("https://syd.cloud.appwrite.io/v1")
  .setProject("686d14cb001ff8a18f19")
  .setKey(
    "standard_0938f6740eae1985dd21f3786d3852685c0e94ca5f8092f7b3fd048ed66c3d22f4763db896fe885ddeb2eaf9e862afad7eee1b95023d964c1cc14b4779d931ac0a3e5cbe089b22f0ea1267f14c2448a53fd26d9fe75ec88f6410bcd47bfc3a52a46527bf5f12cb4c7e10cf60f831f2a0edcc47ebed758e8c2e3ffaf7a4c3562f"
  );

const databases = new Databases(client);
const DATABASE_ID = "686d1515003130afaebe";
const STUDENTS_COLLECTION_ID = "686d206a0021a80fefda";
const BATCH_SIZE = 100;
const DELETE_CONCURRENCY = 100;

async function fetchAllStudentIds() {
  let allIds = [];
  let cursor = undefined;
  let hasMore = true;
  while (hasMore) {
    const queries = [
      // Appwrite max limit is 100
      { type: "limit", value: BATCH_SIZE },
    ];
    if (cursor) queries.push({ type: "cursorAfter", value: cursor });
    // Build Appwrite query array
    const appwriteQueries = [require("appwrite").Query.limit(BATCH_SIZE)];
    if (cursor)
      appwriteQueries.push(require("appwrite").Query.cursorAfter(cursor));
    const res = await databases.listDocuments(
      DATABASE_ID,
      STUDENTS_COLLECTION_ID,
      appwriteQueries
    );
    const docs = res.documents;
    if (docs.length === 0) break;
    allIds.push(...docs.map((doc) => doc.$id));
    if (docs.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      cursor = docs[docs.length - 1].$id;
    }
    console.log(`Fetched ${allIds.length} student IDs so far...`);
  }
  return allIds;
}

async function deleteStudentBatch(ids) {
  await Promise.all(
    ids.map(async (id) => {
      try {
        await databases.deleteDocument(DATABASE_ID, STUDENTS_COLLECTION_ID, id);
        console.log(`Deleted student: ${id}`);
      } catch (err) {
        console.error(`Failed to delete student ${id}:`, err.message);
      }
    })
  );
}

async function main() {
  console.log("Fetching all student document IDs...");
  const allIds = await fetchAllStudentIds();
  if (allIds.length === 0) {
    console.log("No students to delete.");
    process.exit(0);
  }
  console.log(`Total students to delete: ${allIds.length}`);
  let deleted = 0;
  for (let i = 0; i < allIds.length; i += DELETE_CONCURRENCY) {
    const batch = allIds.slice(i, i + DELETE_CONCURRENCY);
    await deleteStudentBatch(batch);
    deleted += batch.length;
    console.log(`Progress: ${deleted}/${allIds.length} deleted.`);
  }
  console.log("All students deleted.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
