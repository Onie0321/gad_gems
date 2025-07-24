// Load environment variables
require('dotenv').config();

const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Configuration
const databaseId = '683e381500342320c476';
const targetCollectionId = '683e49c8000f1a45f34a';

async function testApiPermissions() {
  try {
    console.log('🔍 Testing API Key Permissions...');
    console.log('Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
    console.log('Project ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
    console.log('API Key:', process.env.APPWRITE_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('Database ID:', databaseId);
    console.log('');

    // Test 1: List databases
    console.log('1. Testing database access...');
    try {
      const databaseList = await databases.list();
      console.log('✅ Can list databases');
      console.log('   Available databases:', databaseList.databases.length);
      databaseList.databases.forEach(db => {
        console.log(`   - ${db.name} (${db.$id})`);
      });
    } catch (error) {
      console.log('❌ Cannot list databases:', error.message);
    }
    console.log('');

    // Test 2: Get specific database
    console.log('2. Testing specific database access...');
    try {
      const database = await databases.get(databaseId);
      console.log('✅ Can access database:', database.name);
    } catch (error) {
      console.log('❌ Cannot access database:', error.message);
    }
    console.log('');

    // Test 3: List collections in database
    console.log('3. Testing collection listing...');
    try {
      const collections = await databases.listCollections(databaseId);
      console.log('✅ Can list collections');
      console.log('   Available collections:', collections.total);
      collections.collections.forEach(col => {
        console.log(`   - ${col.name} (${col.$id})`);
      });
    } catch (error) {
      console.log('❌ Cannot list collections:', error.message);
    }
    console.log('');

    // Test 4: Check specific collection
    console.log('4. Testing specific collection access...');
    try {
      const collection = await databases.getCollection(databaseId, targetCollectionId);
      console.log('✅ Can access target collection:', collection.name);
      console.log('   Collection ID:', collection.$id);
      console.log('   Created:', collection.$createdAt);
    } catch (error) {
      console.log('❌ Cannot access target collection:', error.message);
    }
    console.log('');

    // Test 5: Try to read from collection
    console.log('5. Testing read permissions...');
    try {
      const documents = await databases.listDocuments(databaseId, targetCollectionId, [], 1);
      console.log('✅ Can read from collection');
      console.log('   Documents in collection:', documents.total);
    } catch (error) {
      console.log('❌ Cannot read from collection:', error.message);
    }
    console.log('');

    // Test 6: Try to create a test document
    console.log('6. Testing write permissions...');
    try {
      const testDoc = await databases.createDocument(
        databaseId,
        targetCollectionId,
        'test-doc-' + Date.now(),
        {
          name: 'Test Document',
          studentId: 'TEST001',
          lastName: 'Test',
          firstName: 'User',
          school: 'Test School',
          year: '2024',
          age: '20',
          sex: 'Male',
          address: 'Test Address',
          createdBy: 'test-script',
          isArchived: false,
          academicPeriodId: '',
          eventId: '',
          section: ''
        }
      );
      console.log('✅ Can write to collection');
      console.log('   Test document created:', testDoc.$id);
      
      // Clean up test document
      try {
        await databases.deleteDocument(databaseId, targetCollectionId, testDoc.$id);
        console.log('   Test document cleaned up');
      } catch (cleanupError) {
        console.log('   Warning: Could not clean up test document:', cleanupError.message);
      }
    } catch (error) {
      console.log('❌ Cannot write to collection:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testApiPermissions(); 