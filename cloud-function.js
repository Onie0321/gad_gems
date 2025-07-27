const { Client, Account, Databases, ID, Query } = require("node-appwrite");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID || "686d14cb001ff8a18f19");

const account = new Account(client);
const databases = new Databases(client);

// CORS configuration
const ALLOWED_ORIGIN =
  "https://gad-gems-646o-nm7coxs2d-onie0321s-projects.vercel.app";
const ALLOWED_HEADERS = ["Authorization", "Content-Type", "X-Appwrite-Project"];

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS.join(", "));
  res.setHeader("Access-Control-Max-Age", "86400");
}

// Helper function to send JSON response
function sendJsonResponse(res, statusCode, data) {
  setCorsHeaders(res);
  res.setHeader("Content-Type", "application/json");
  res.status(statusCode).json(data);
}

// Helper function to validate JWT token
async function validateToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Set the JWT token for the client
    client.setJWT(token);

    // Try to get the current user to validate the token
    const user = await account.get();
    return user;
  } catch (error) {
    console.error("Token validation error:", error.message);
    return null;
  }
}

// Helper function to handle unauthorized access
function handleUnauthorized(res) {
  return sendJsonResponse(res, 401, {
    success: false,
    message: "Unauthorized access",
    timestamp: new Date().toISOString(),
  });
}

// Main function handler
module.exports = async (req, res) => {
  // Handle OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.status(200).end();
    return;
  }

  // Validate origin
  const origin = req.headers.origin || req.headers.referer;
  if (origin && !origin.includes(ALLOWED_ORIGIN)) {
    return sendJsonResponse(res, 403, {
      success: false,
      message: "Access denied",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { method, path, body, headers } = req;
    const authHeader = headers.authorization;

    // Route handling based on method and path
    switch (method) {
      case "GET":
        await handleGetRequest(req, res, authHeader);
        break;
      case "POST":
        await handlePostRequest(req, res, authHeader);
        break;
      default:
        sendJsonResponse(res, 405, {
          success: false,
          message: "Method not allowed",
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("Function error:", error);
    sendJsonResponse(res, 500, {
      success: false,
      message: "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
};

// Handle GET requests
async function handleGetRequest(req, res, authHeader) {
  const { path } = req;

  // Public endpoints (no authentication required)
  if (path === "/health" || path === "/status") {
    return sendJsonResponse(res, 200, {
      success: true,
      message: "Service is running",
      timestamp: new Date().toISOString(),
    });
  }

  // Protected endpoints (authentication required)
  const user = await validateToken(authHeader);
  if (!user) {
    return handleUnauthorized(res);
  }

  try {
    // Handle different GET endpoints
    if (path === "/user/profile") {
      return sendJsonResponse(res, 200, {
        success: true,
        data: {
          id: user.$id,
          email: user.email,
          name: user.name,
          createdAt: user.$createdAt,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (path === "/data/students") {
      const students = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_STUDENTS_COLLECTION_ID,
        [Query.limit(100)]
      );

      return sendJsonResponse(res, 200, {
        success: true,
        data: students.documents,
        total: students.total,
        timestamp: new Date().toISOString(),
      });
    }

    if (path === "/data/events") {
      const events = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_EVENT_COLLECTION_ID,
        [Query.limit(100)]
      );

      return sendJsonResponse(res, 200, {
        success: true,
        data: events.documents,
        total: events.total,
        timestamp: new Date().toISOString(),
      });
    }

    // Default response for unknown GET paths
    sendJsonResponse(res, 404, {
      success: false,
      message: "Endpoint not found",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET request error:", error);
    sendJsonResponse(res, 500, {
      success: false,
      message: "Failed to fetch data",
      timestamp: new Date().toISOString(),
    });
  }
}

// Handle POST requests
async function handlePostRequest(req, res, authHeader) {
  const { path, body } = req;

  try {
    // Public endpoints (no authentication required)
    if (path === "/auth/login") {
      return await handleLogin(req, res);
    }

    if (path === "/auth/signup") {
      return await handleSignup(req, res);
    }

    // Protected endpoints (authentication required)
    const user = await validateToken(authHeader);
    if (!user) {
      return handleUnauthorized(res);
    }

    // Handle different POST endpoints
    if (path === "/form/submit") {
      return await handleFormSubmission(req, res, user);
    }

    if (path === "/data/create") {
      return await handleDataCreation(req, res, user);
    }

    if (path === "/user/update") {
      return await handleUserUpdate(req, res, user);
    }

    // Default response for unknown POST paths
    sendJsonResponse(res, 404, {
      success: false,
      message: "Endpoint not found",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST request error:", error);
    sendJsonResponse(res, 500, {
      success: false,
      message: "Failed to process request",
      timestamp: new Date().toISOString(),
    });
  }
}

// Handle login
async function handleLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendJsonResponse(res, 400, {
      success: false,
      message: "Email and password are required",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const session = await account.createSession(email, password);
    const user = await account.get();

    sendJsonResponse(res, 200, {
      success: true,
      message: "Login successful",
      data: {
        sessionId: session.$id,
        userId: user.$id,
        email: user.email,
        name: user.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Login error:", error);
    sendJsonResponse(res, 401, {
      success: false,
      message: "Invalid credentials",
      timestamp: new Date().toISOString(),
    });
  }
}

// Handle signup
async function handleSignup(req, res) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return sendJsonResponse(res, 400, {
      success: false,
      message: "Email, password, and name are required",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const newAccount = await account.create(ID.unique(), email, password, name);
    const session = await account.createSession(email, password);

    sendJsonResponse(res, 201, {
      success: true,
      message: "Account created successfully",
      data: {
        sessionId: session.$id,
        userId: newAccount.$id,
        email: newAccount.email,
        name: newAccount.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Signup error:", error);
    sendJsonResponse(res, 400, {
      success: false,
      message: "Failed to create account",
      timestamp: new Date().toISOString(),
    });
  }
}

// Handle form submission
async function handleFormSubmission(req, res, user) {
  const { formData, formType } = req.body;

  if (!formData || !formType) {
    return sendJsonResponse(res, 400, {
      success: false,
      message: "Form data and type are required",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Determine collection based on form type
    let collectionId;
    switch (formType) {
      case "student":
        collectionId = process.env.APPWRITE_STUDENTS_COLLECTION_ID;
        break;
      case "event":
        collectionId = process.env.APPWRITE_EVENT_COLLECTION_ID;
        break;
      default:
        return sendJsonResponse(res, 400, {
          success: false,
          message: "Invalid form type",
          timestamp: new Date().toISOString(),
        });
    }

    const document = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      collectionId,
      ID.unique(),
      {
        ...formData,
        createdBy: user.$id,
        createdAt: new Date().toISOString(),
      }
    );

    sendJsonResponse(res, 201, {
      success: true,
      message: "Form submitted successfully",
      data: document,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Form submission error:", error);
    sendJsonResponse(res, 500, {
      success: false,
      message: "Failed to submit form",
      timestamp: new Date().toISOString(),
    });
  }
}

// Handle data creation
async function handleDataCreation(req, res, user) {
  const { data, collection } = req.body;

  if (!data || !collection) {
    return sendJsonResponse(res, 400, {
      success: false,
      message: "Data and collection are required",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const document = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      collection,
      ID.unique(),
      {
        ...data,
        createdBy: user.$id,
        createdAt: new Date().toISOString(),
      }
    );

    sendJsonResponse(res, 201, {
      success: true,
      message: "Data created successfully",
      data: document,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Data creation error:", error);
    sendJsonResponse(res, 500, {
      success: false,
      message: "Failed to create data",
      timestamp: new Date().toISOString(),
    });
  }
}

// Handle user update
async function handleUserUpdate(req, res, user) {
  const { updates } = req.body;

  if (!updates) {
    return sendJsonResponse(res, 400, {
      success: false,
      message: "Update data is required",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const updatedUser = await account.updateName(updates.name || user.name);
    if (updates.email && updates.email !== user.email) {
      await account.updateEmail(updates.email);
    }

    sendJsonResponse(res, 200, {
      success: true,
      message: "User updated successfully",
      data: {
        id: updatedUser.$id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("User update error:", error);
    sendJsonResponse(res, 500, {
      success: false,
      message: "Failed to update user",
      timestamp: new Date().toISOString(),
    });
  }
}
