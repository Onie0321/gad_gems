# GAD Gems Appwrite Cloud Function

A comprehensive Appwrite Cloud Function that handles authentication, data operations, and form submissions with proper CORS and security measures.

## 🚀 Features

- **Authentication**: Login and signup endpoints
- **Data Operations**: CRUD operations for students, events, and other data
- **Form Submission**: Handle various form types
- **Security**: JWT token validation and origin restrictions
- **CORS**: Proper CORS configuration for your Vercel domain
- **Error Handling**: Comprehensive error handling with safe error messages

## 📋 Prerequisites

- Appwrite Cloud account
- Node.js 18+ environment
- Environment variables configured

## 🔧 Environment Variables

Set these environment variables in your Appwrite Cloud Function:

```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=686d14cb001ff8a18f19
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_STUDENTS_COLLECTION_ID=your_students_collection_id
APPWRITE_EVENT_COLLECTION_ID=your_events_collection_id
```

## 📦 Installation

1. **Upload the files to Appwrite Cloud Functions:**

   - `cloud-function.js` (main function)
   - `cloud-function-package.json` (dependencies)

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Deploy the function in Appwrite Console**

## 🌐 API Endpoints

### Public Endpoints (No Authentication Required)

#### Health Check

```http
GET /health
GET /status
```

#### Authentication

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Protected Endpoints (Authentication Required)

Include the JWT token in the Authorization header:

```http
Authorization: Bearer your_jwt_token_here
```

#### User Profile

```http
GET /user/profile
```

#### Data Fetching

```http
GET /data/students
GET /data/events
```

#### Form Submission

```http
POST /form/submit
Content-Type: application/json

{
  "formData": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25
  },
  "formType": "student"
}
```

#### Data Creation

```http
POST /data/create
Content-Type: application/json

{
  "data": {
    "title": "New Event",
    "description": "Event description"
  },
  "collection": "your_collection_id"
}
```

#### User Update

```http
POST /user/update
Content-Type: application/json

{
  "updates": {
    "name": "Updated Name",
    "email": "newemail@example.com"
  }
}
```

## 🔒 Security Features

### CORS Configuration

- **Allowed Origin**: `https://gad-gems-646o-nm7coxs2d-onie0321s-projects.vercel.app`
- **Allowed Methods**: GET, POST, OPTIONS
- **Allowed Headers**: Authorization, Content-Type, X-Appwrite-Project

### Authentication

- JWT token validation for protected endpoints
- Secure error handling without exposing sensitive information
- Session management with Appwrite

### Origin Validation

- Requests are only accepted from the specified Vercel domain
- 403 Forbidden response for unauthorized origins

## 📝 Response Format

All responses follow this format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {}, // Optional data payload
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚨 Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "message": "Email and password are required",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized access",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "Endpoint not found",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Usage Examples

### Frontend Integration

```javascript
// Login example
const loginUser = async (email, password) => {
  const response = await fetch(
    "https://your-appwrite-function-url/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }
  );

  const data = await response.json();
  if (data.success) {
    // Store the session token
    localStorage.setItem("sessionToken", data.data.sessionId);
  }
  return data;
};

// Protected request example
const fetchUserProfile = async () => {
  const token = localStorage.getItem("sessionToken");
  const response = await fetch(
    "https://your-appwrite-function-url/user/profile",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return await response.json();
};
```

## 🛠️ Customization

### Adding New Endpoints

1. Add the endpoint logic in the appropriate handler function
2. Update the routing logic in the main function
3. Add proper error handling and validation

### Modifying CORS

Update the `ALLOWED_ORIGIN` constant in `cloud-function.js`:

```javascript
const ALLOWED_ORIGIN = "your-new-domain.com";
```

### Adding New Collections

1. Add environment variables for new collection IDs
2. Create new endpoint handlers
3. Update the form submission logic if needed

## 📞 Support

For issues or questions:

1. Check the Appwrite Cloud Function logs
2. Verify environment variables are set correctly
3. Ensure the JWT token is valid and not expired
4. Confirm the request origin matches the allowed domain

## 🔄 Version History

- **v1.0.0**: Initial release with authentication, data operations, and form submission
