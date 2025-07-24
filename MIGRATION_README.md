# Student Collection Migration Guide

This guide will help you migrate data from the `students_new` collection to a new auto-generated collection.

## Prerequisites

1. **Appwrite API Key**: You need an API key with full access to your database
2. **Node.js**: Make sure you have Node.js installed
3. **Environment Variables**: Ensure your `.env` file has the required variables

## Required Environment Variables

Add these to your `.env` file:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=your_appwrite_endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
APPWRITE_API_KEY=your_api_key
```

## Step-by-Step Migration Process

### Step 1: Install Dependencies

```bash
npm install node-appwrite dotenv
```

### Step 2: Run the Complete Migration

```bash
npm run migrate-complete
```

This will:

- Create a new collection with an auto-generated ID
- Create all necessary attributes
- Migrate all data from `students_new` to the new collection
- Automatically update your `appwrite.js` file with the new collection ID
- Provide a detailed summary of the migration

### Alternative: Run Steps Separately

If you prefer to run the steps separately:

```bash
# Step 1: Run migration only
npm run migrate

# Step 2: Update appwrite.js with new collection ID
npm run update-config
```

### Step 3: Verify the Migration

1. Check the console output for any errors
2. Verify that the document count matches between old and new collections
3. Test your application with the new collection
4. Check that `migration-config.json` was created with the new collection ID

### Step 4: Delete the Old Collection (Optional)

**⚠️ WARNING: This action is irreversible!**

Only delete the old collection after you've confirmed everything is working correctly.

```bash
# Check the old collection (safe)
npm run delete-old

# Delete the old collection (requires confirmation)
npm run delete-old-confirm

# Force delete even if counts don't match (use with caution)
npm run delete-old-force
```

## Migration Script Features

### migrate-students.js

- ✅ Creates new collection with auto-generated ID
- ✅ Creates all necessary attributes
- ✅ Handles pagination for large datasets
- ✅ Provides detailed progress reporting
- ✅ Includes error handling and retry logic
- ✅ Verifies migration success
- ✅ Rate limiting to prevent API throttling
- ✅ Saves migration config to `migration-config.json`

### update-appwrite-config.js

- ✅ Automatically updates `src/lib/appwrite.js` with new collection ID
- ✅ Reads migration config from `migration-config.json`
- ✅ Provides fallback instructions if update fails

### delete-old-collection.js

- ✅ Reads new collection ID from migration config
- ✅ Verifies new collection has data before deletion
- ✅ Compares document counts
- ✅ Requires explicit confirmation
- ✅ Provides safety checks

## Generated Files

After migration, these files will be created:

- `migration-config.json` - Contains the new collection ID and migration details
- Updated `src/lib/appwrite.js` - Updated with the new collection ID

## Troubleshooting

### Common Issues

1. **API Key Permissions**: Ensure your API key has full database access
2. **Rate Limiting**: The script includes delays to prevent rate limiting
3. **Network Issues**: Check your internet connection and Appwrite endpoint
4. **Environment Variables**: Verify all required variables are set

### Error Messages

- `Collection already exists`: Normal if you've run the script before
- `Attribute already exists`: Normal if attributes were already created
- `404 Not Found`: Check your collection IDs and database ID
- `401 Unauthorized`: Check your API key permissions
- `migration-config.json not found`: Run the migration first

## Rollback Plan

If something goes wrong:

1. **Don't delete the old collection** until you're sure everything works
2. **Keep the old collection** as a backup
3. **Test thoroughly** before proceeding with deletion
4. **Monitor your application** after the migration

## Support

If you encounter issues:

1. Check the console output for detailed error messages
2. Verify your environment variables
3. Ensure your API key has the correct permissions
4. Test with a small subset of data first

## Collection Attributes

The new collection includes these attributes:

- `studentId` (string, required)
- `lastName` (string, required)
- `firstName` (string, required)
- `middleName` (string, optional)
- `school` (string, required)
- `year` (string, required)
- `age` (string, required)
- `sex` (string, required)
- `orientation` (string, optional)
- `religion` (string, optional)
- `address` (string, required)
- `ethnicGroup` (string, optional)
- `firstGen` (string, optional)
- `createdBy` (string, required)
- `isArchived` (boolean, optional, default: false)
- `academicPeriodId` (string, optional)
- `eventId` (string, optional)
- `section` (string, optional)
