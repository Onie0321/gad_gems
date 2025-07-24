# Fix Appwrite API Key Permissions

## Issue

Your API key is missing the required `account` scope, causing 401/402 errors.

## Solution Steps

### 1. Go to Appwrite Console

- Visit: https://cloud.appwrite.io/console
- Select your project: `67d029d100075de4c69b`

### 2. Create New API Key

1. Go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Give it a name like "GAD App Full Access"

### 3. Set Proper Permissions

Make sure to grant these scopes:

- ✅ **account** - Required for user authentication
- ✅ **databases.read** - Read database access
- ✅ **databases.write** - Write database access
- ✅ **storage.read** - Read file storage
- ✅ **storage.write** - Write file storage
- ✅ **teams.read** - Read team access
- ✅ **teams.write** - Write team access

### 4. Update Environment Variables

Replace your current `APPWRITE_API_KEY` in your `.env.local` file with the new API key.

### 5. Test the Connection

Run the diagnostic script again:

```bash
node check-appwrite-status.js
```

## Alternative: Use Service Account

If you prefer, you can also use a Service Account instead of an API Key:

1. Go to **Settings** > **Service Accounts**
2. Create a new service account
3. Generate a JWT token
4. Use the JWT token in your application

## Important Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys for security
