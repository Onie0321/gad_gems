# Collection Permissions Update Script

This script automatically updates all collections in your Appwrite project to have the following permissions:

- Allow `role:all` to create documents
- Allow `role:all` to read documents
- Allow `role:all` to update documents

## Prerequisites

- Node.js installed on your system
- Appwrite project with API key that has collection management permissions
- The `node-appwrite` package (already included in this project)

## Configuration

Before running the script, you need to update the configuration variables in `update-collection-permissions.js`:

```javascript
const client = new Client()
  .setEndpoint("https://YOUR_APPWRITE_ENDPOINT/v1")
  .setProject("YOUR_PROJECT_ID")
  .setKey("YOUR_API_KEY");

const DATABASE_ID = "YOUR_DATABASE_ID";
```

### Required Values:

1. **YOUR_APPWRITE_ENDPOINT**: Your Appwrite server endpoint (e.g., `https://cloud.appwrite.io` or your self-hosted URL)
2. **YOUR_PROJECT_ID**: Your Appwrite project ID (found in your project settings)
3. **YOUR_API_KEY**: Your Appwrite API key with collection management permissions
4. **YOUR_DATABASE_ID**: Your Appwrite database ID

## Running the Script

1. **Update the configuration** in `update-collection-permissions.js` with your actual values
2. **Run the script**:

```bash
node update-collection-permissions.js
```

## What the Script Does

1. **Connection Test**: First tests the connection to your Appwrite instance
2. **Collection Discovery**: Fetches all collections in your database
3. **Permission Updates**: Updates each collection with the new permissions:
   - `Permission.create(Role.all())` - Anyone can create documents
   - `Permission.read(Role.all())` - Anyone can read documents
   - `Permission.update(Role.all())` - Anyone can update documents
4. **Progress Tracking**: Shows progress for each collection update
5. **Summary Report**: Provides a final summary of successful and failed updates

## Output Example

```
🔧 Collection Permissions Update Script
=====================================

🔍 Testing connection to Appwrite...
✅ Connection successful!

🚀 Starting collection permissions update...

📋 Fetching all collections...
Found 8 collections to update.

🔄 Updating permissions for collection: users (users_collection_id)
✅ Successfully updated permissions for collection: users

🔄 Updating permissions for collection: events (events_collection_id)
✅ Successfully updated permissions for collection: events

...

📊 Update Summary:
✅ Successfully updated: 8 collections
❌ Failed to update: 0 collections
📈 Total collections processed: 8

🎉 All collections updated successfully!

🏁 Script completed.
```

## Error Handling

The script includes comprehensive error handling:

- **Connection errors**: Tests connection before proceeding
- **Individual collection errors**: Continues processing other collections if one fails
- **Rate limiting**: Includes delays between updates to avoid API rate limits
- **Detailed logging**: Shows specific error messages for troubleshooting

## Security Considerations

⚠️ **Important**: This script gives `role:all` (anyone) permission to create, read, and update documents. This means:

- **Anyone** can create new documents in your collections
- **Anyone** can read all documents in your collections
- **Anyone** can update existing documents in your collections

Make sure this aligns with your security requirements before running the script.

## Troubleshooting

### Common Issues:

1. **"Connection failed"**: Check your endpoint, project ID, and API key
2. **"Permission denied"**: Ensure your API key has collection management permissions
3. **"Database not found"**: Verify your database ID is correct
4. **Rate limiting errors**: The script includes delays, but you may need to increase them for large numbers of collections

### API Key Permissions Required:

Your API key needs the following permissions:

- `databases.read`
- `databases.write`
- `collections.read`
- `collections.write`

## Rollback

If you need to revert the permissions, you can:

1. Use the Appwrite console to manually update collection permissions
2. Create a similar script with different permissions
3. Use the Appwrite CLI if available

## Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your configuration values
3. Ensure your API key has the required permissions
4. Check your Appwrite project settings
