import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
  Permission,
  Role,
  Teams,
  RealtimeResponseEvent,
} from "appwrite";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  maxDelay: 10000, // 10 seconds
};

// Cache configuration to reduce API calls
const CACHE = {
  userCache: new Map(),
  accountCache: new Map(),
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
};

// Helper function to handle rate limiting
async function handleRateLimit(operation) {
  let retries = 0;
  let delay = RATE_LIMIT.retryDelay;

  while (retries < RATE_LIMIT.maxRetries) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 429 && retries < RATE_LIMIT.maxRetries) {
        console.log(
          `Rate limit hit, retrying in ${delay}ms... (Attempt ${retries + 1}/${
            RATE_LIMIT.maxRetries
          })`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, RATE_LIMIT.maxDelay); // Exponential backoff
        retries++;
      } else {
        throw error;
      }
    }
  }
}

// Cache helper functions
function getCachedData(cache, key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE.cacheTimeout) {
    return cached.data;
  }
  return null;
}

function setCachedData(cache, key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

function clearCache(cache) {
  cache.clear();
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Initialize Appwrite Databases
const databases = new Databases(client);

// Database and Collection IDs
export const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
export const eventCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID;
export const newsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_NEWS_COLLECTION_ID;
export const userCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID;
export const studentCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_STUDENT_COLLECTION_ID;
export const staffFacultyCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_STAFF_FACULTY_COLLECTION_ID;
export const communityCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_COMMUNITY_COLLECTION_ID;
export const academicPeriodCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_ACADEMIC_PERIOD_COLLECTION_ID;
export const notificationsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

// Export databases instance
export { databases };

// Log configuration (only in development)
if (process.env.NODE_ENV === "development") {
  console.log("Appwrite Configuration:", {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: databaseId,
    collections: {
      events: eventCollectionId,
      news: newsCollectionId,
      users: userCollectionId,
      students: studentCollectionId,
      staffFaculty: staffFacultyCollectionId,
      community: communityCollectionId,
      academicPeriod: academicPeriodCollectionId,
      notifications: notificationsCollectionId,
    },
  });
}

export const account = new Account(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

// Cache management functions
export const clearUserCache = () => clearCache(CACHE.userCache);
export const clearAccountCache = () => clearCache(CACHE.accountCache);
export const clearAllCaches = () => {
  clearCache(CACHE.userCache);
  clearCache(CACHE.accountCache);
};

export const updateUserFirstLogin = async (userId) => {
  try {
    await databases.updateDocument(databaseId, userCollectionId, userId, {
      isFirstLogin: false,
    });
    // Clear user cache after update
    clearCache(CACHE.userCache);
  } catch (error) {
    throw error;
  }
};

export const subscribe = (collectionId, callback) => {
  const unsubscribe = client.subscribe(
    `databases.${databaseId}.collections.${collectionId}.documents`,
    (response) => {
      callback(response.payload);
    }
  );

  return unsubscribe;
};

export async function createUser(email, password, name, role = "user") {
  let createdAccount = null;
  let createdUser = null;

  try {
    console.log("Starting User Creation Process:", {
      email,
      name,
      role,
      timestamp: new Date().toISOString(),
    });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid Email Format:", { email });
      throw new Error("Invalid email format");
    }

    // Validate password requirements
    const passwordRequirements = {
      length: password.length >= 8,
      hasLowerCase: /[a-z]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
    };

    console.log("Password Validation:", {
      passwordLength: password.length,
      requirements: passwordRequirements,
    });

    const missingRequirements = Object.entries(passwordRequirements)
      .filter(([_, met]) => !met)
      .map(([req]) => req);

    if (missingRequirements.length > 0) {
      console.error("Password Requirements Not Met:", {
        missingRequirements,
        passwordLength: password.length,
      });
      throw new Error(
        `Password must meet all requirements: ${missingRequirements.join(", ")}`
      );
    }

    // Check if email already exists
    try {
      console.log("Checking for existing email...");
      const existingUsers = await databases.listDocuments(
        databaseId,
        userCollectionId,
        [Query.equal("email", email)]
      );

      if (existingUsers.total > 0) {
        console.error("Email Already Exists:", { email });
        throw new Error("Email already exists");
      }
      console.log("Email is available");
    } catch (error) {
      console.error("Error Checking Existing Email:", {
        error: {
          code: error.code,
          message: error.message,
          type: error.type,
          response: error.response,
        },
      });
      throw error;
    }

    // Create Appwrite account
    console.log("Creating Account in Appwrite...");
    try {
      createdAccount = await account.create("unique()", email, password, name);
      console.log("Account Created Successfully:", {
        userId: createdAccount.$id,
        email: createdAccount.email,
        name: createdAccount.name,
      });
    } catch (error) {
      console.error("Appwrite Account Creation Error:", {
        error: {
          code: error.code,
          message: error.message,
          type: error.type,
          response: error.response,
          stack: error.stack,
        },
        requestData: {
          email,
          name,
          passwordLength: password.length,
        },
      });
      throw error;
    }

    // Create user document
    console.log("Creating User Document in Database...");
    try {
      createdUser = await databases.createDocument(
        databaseId,
        userCollectionId,
        "unique()",
        {
          accountId: createdAccount.$id,
          email: email,
          name: name,
          role: role,
          approvalStatus: "pending",
          isFirstLogin: true,
          password: "********", // Placeholder for schema requirement
        }
      );
      console.log("User Document Created Successfully:", {
        documentId: createdUser.$id,
        accountId: createdUser.accountId,
        role: createdUser.role,
      });
    } catch (error) {
      console.error("User Document Creation Error:", {
        error: {
          code: error.code,
          message: error.message,
          type: error.type,
          response: error.response,
          stack: error.stack,
        },
        accountId: createdAccount.$id,
      });
      // Clean up created account if document creation fails
      try {
        await account.delete(createdAccount.$id);
        console.log(
          "Cleaned up created account after document creation failure"
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clean up account after document creation failure:",
          cleanupError
        );
      }
      throw error;
    }

    // Create notification and log activity
    try {
      console.log("Creating notification and logging activity...");
      await Promise.all([
        logActivity(createdUser.$id, "User Registered: " + name),
        createNotification({
          userId: "admin",
          type: "account",
          title: "New User Registration",
          message: `New user ${name} has registered and requires approval.`,
          actionType: "user_registration",
          status: "pending",
          approvalStatus: "pending",
          read: false,
        }),
      ]);
      console.log("Notification and activity log created successfully");
    } catch (error) {
      console.error("Notification/Activity Log Creation Error:", {
        error: {
          code: error.code,
          message: error.message,
          type: error.type,
          response: error.response,
          stack: error.stack,
        },
        userId: createdUser.$id,
      });
      // Don't throw here, as the user is already created
    }

    return createdUser;
  } catch (error) {
    console.error("User Creation Error:", {
      error: {
        code: error.code,
        message: error.message,
        type: error.type,
        response: error.response,
        stack: error.stack,
      },
      email,
      name,
      role,
      timestamp: new Date().toISOString(),
      createdAccount: createdAccount
        ? {
            id: createdAccount.$id,
            email: createdAccount.email,
          }
        : null,
      createdUser: createdUser
        ? {
            id: createdUser.$id,
            accountId: createdUser.accountId,
          }
        : null,
    });
    throw error;
  }
}

export async function getAllUsers(email) {
  try {
    const response = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.equal("email", email)]
    );

    return response.total > 0;
  } catch (error) {
    throw error;
  }
}

export const checkAndRefreshSession = async () => {
  try {
    await account.get();
    return true;
  } catch (error) {
    if (error.code === 401) {
      try {
        await account.createAnonymousSession();
        return true;
      } catch (refreshError) {
        return false;
      }
    }
    return false;
  }
};

export async function getAccount() {
  try {
    // Check cache first
    const cachedAccount = getCachedData(CACHE.accountCache, "current");
    if (cachedAccount) {
      return cachedAccount;
    }

    const currentAccount = await account.get();

    // Cache the result
    setCachedData(CACHE.accountCache, "current", currentAccount);

    return currentAccount;
  } catch (error) {
    if (
      error.code === 401 ||
      (error.message && error.message.includes("unauthorized")) ||
      (error.message && error.message.includes("Missing scope"))
    ) {
      // No session, return null instead of throwing
      return null;
    } else {
      throw new Error(error.message || "Error fetching account");
    }
  }
}

export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount || !currentAccount.$id) {
      // No session, return null instead of throwing
      return null;
    }

    // Check cache first
    const cachedUser = getCachedData(CACHE.userCache, currentAccount.$id);
    if (cachedUser) {
      return cachedUser;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Getting user document for account:", currentAccount.$id);
      console.log("Using database ID:", databaseId);
      console.log("Using user collection ID:", userCollectionId);
    }

    // Query for the user document using the accountId
    const currentUserResponse = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (process.env.NODE_ENV === "development") {
      console.log("User document response:", currentUserResponse);
    }

    let userDocument;

    if (
      !currentUserResponse ||
      !Array.isArray(currentUserResponse.documents) ||
      currentUserResponse.total === 0
    ) {
      if (process.env.NODE_ENV === "development") {
        console.log("No user document found for account:", currentAccount.$id);
        console.log("Creating new user document...");
      }

      // Create new user document if one doesn't exist
      userDocument = await databases.createDocument(
        databaseId,
        userCollectionId,
        ID.unique(),
        {
          accountId: currentAccount.$id,
          email: currentAccount.email,
          name: currentAccount.name,
          role: "user",
          approvalStatus: "pending",
          isFirstLogin: true,
          password: "oauth_user_" + currentAccount.$id, // Placeholder password for OAuth users
        }
      );

      if (process.env.NODE_ENV === "development") {
        console.log("Created new user document:", userDocument);
      }
    } else {
      userDocument = currentUserResponse.documents[0]; // Get the user document

      if (process.env.NODE_ENV === "development") {
        console.log("Found user document:", userDocument);
      }

      // Check if the role field exists in the document
      if (!userDocument.role) {
        if (process.env.NODE_ENV === "development") {
          console.log("No role found in user document, assigning default role");
        }
        // If the role field is missing, assign a default role (e.g., 'user')
        userDocument.role = "user";
      }
    }

    // Cache the result
    setCachedData(CACHE.userCache, currentAccount.$id, userDocument);

    return userDocument; // Return the user document which includes role
  } catch (error) {
    if (
      error.code === 401 ||
      (error.message && error.message.includes("unauthorized"))
    ) {
      // No session, return null instead of throwing
      return null;
    }
    console.error("Error in getCurrentUser:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      type: error.type,
      response: error.response,
    });
    throw error;
  }
}

export async function getUserRole(userId) {
  try {
    // Check cache first
    const cachedUser = getCachedData(CACHE.userCache, userId);
    if (cachedUser) {
      return cachedUser.role;
    }

    const user = await databases.getDocument(
      databaseId,
      userCollectionId,
      userId
    );

    // Cache the user data
    setCachedData(CACHE.userCache, userId, user);

    return user.role;
  } catch (error) {
    throw new Error("Unable to fetch user role. Please try again.");
  }
}

export async function updateUser(userId, updatedData) {
  try {
    const response = await databases.updateDocument(
      databaseId,
      userCollectionId,
      userId, // Removed .`$id` since userId should be
      updatedData
    );

    // Clear user cache after update
    clearCache(CACHE.userCache);

    return response;
  } catch (error) {
    throw new Error("Failed to update user.");
  }
}

// Function to delete a user
export async function deleteUser(userId) {
  try {
    await databases.deleteDocument(databaseId, userCollectionId, userId.$id);
  } catch (error) {
    throw new Error("Failed to delete user.");
  }
}

// Sign In
export async function SignIn(email, password) {
  try {
    console.log("Starting sign in process for:", email);
    console.log("Using database ID:", databaseId);
    console.log("Using user collection ID:", userCollectionId);

    // Delete any existing session
    try {
      await account.deleteSession("current");
      console.log("Cleaned up existing session");
    } catch (error) {
      console.log("No existing session to clean up");
    }

    // Add a delay before creating new session
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create new session
    console.log("Creating new session...");
    const session = await handleRateLimit(() =>
      account.createEmailPasswordSession(email, password)
    );
    console.log("Session created successfully");

    // Add a delay before getting account details
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get account details
    console.log("Getting account details...");
    const accountDetails = await handleRateLimit(() => account.get());
    console.log("Account details retrieved successfully");

    // Add a delay before getting user document
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get user document from database
    console.log("Getting user document from database...");
    try {
      const userDocuments = await handleRateLimit(() =>
        databases.listDocuments(databaseId, userCollectionId, [
          Query.equal("accountId", accountDetails.$id),
        ])
      );

      console.log("User document response:", userDocuments);

      if (!userDocuments || userDocuments.total === 0) {
        console.log("User document not found, creating new one...");
        // Create new user document
        const newUser = await handleRateLimit(() =>
          databases.createDocument(databaseId, userCollectionId, ID.unique(), {
            accountId: accountDetails.$id,
            email: email,
            name: accountDetails.name,
            role: "user",
            approvalStatus: "pending",
            isFirstLogin: true,
          })
        );
        console.log("Created new user document:", newUser);
        return { account: accountDetails, user: newUser };
      }

      console.log("Found existing user document:", userDocuments.documents[0]);
      return { account: accountDetails, user: userDocuments.documents[0] };
    } catch (error) {
      console.error("Database operation error:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        type: error.type,
        response: error.response,
      });
      if (error.code === 404) {
        throw new Error(
          "Database or collection not found. Please check your configuration."
        );
      }
      throw new Error(`Failed to get user details: ${error.message}`);
    }
  } catch (error) {
    console.error("Sign in error details:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      type: error.type,
      response: error.response,
    });
    if (error.code === 401) {
      throw new Error("Invalid email or password");
    } else if (error.code === 429) {
      throw new Error("Too many login attempts. Please try again later.");
    }
    throw new Error(`Sign in failed: ${error.message}`);
  }
}

export const createEmailSession = async (email, password) => {
  try {
    await account.createSession(email, password);
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    throw error;
  }
};

export async function getAllSessions() {
  try {
    const sessions = await account.listSessions();
    return sessions;
  } catch (error) {
    return { sessions: [] };
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    throw new Error(error);
  }
}

export async function deleteSession(sessionId) {
  try {
    await account.deleteSession(sessionId);
  } catch (error) {
    throw new Error("Failed to delete session.");
  }
}

export async function deleteAllSessions() {
  try {
    const sessions = await account.listSessions();
    const deletePromises = sessions.sessions.map((session) =>
      account.deleteSession(session.$id)
    );
    await Promise.all(deletePromises);
  } catch (error) {
    throw new Error("Failed to delete existing sessions");
  }
}

export const checkUserSession = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    return null;
  }
};

export async function setAdminApproval(userId, approved) {
  try {
    await account.updatePrefs({ adminApproved: approved });
    return true;
  } catch (error) {
    return false;
  }
}

export const createEvent = async (eventData) => {
  try {
    const response = await databases.createDocument(
      databaseId,
      eventCollectionId,
      ID.unique(),
      eventData
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const getEvents = async (userId = null) => {
  try {
    let query = [];

    // Add user filter if specified
    if (userId) {
      query.push(Query.equal("createdBy", userId));
    }

    const response = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      query
    );

    return response.documents;
  } catch (error) {
    throw error;
  }
};

export const getParticipants = async (eventId = null, userId = null) => {
  try {
    let query = [];

    // Add event filter if specified
    if (eventId) {
      query.push(Query.equal("eventId", eventId));
    }

    // Add user filter if specified
    if (userId) {
      query.push(Query.equal("createdBy", userId));
    }

    const response = await databases.listDocuments(
      databaseId,
      studentCollectionId,
      query
    );

    return response.documents;
  } catch (error) {
    throw error;
  }
};

// Add this helper function to get a single event
export const getEvent = async (eventId) => {
  try {
    const event = await databases.getDocument(
      databaseId,
      eventCollectionId,
      eventId
    );
    return event;
  } catch (error) {
    throw error;
  }
};

export const checkDuplicateEvent = async (eventName, eventDate, eventVenue) => {
  try {
    const response = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal("eventName", eventName),
        Query.equal("eventDate", eventDate),
        Query.equal("eventVenue", eventVenue),
      ]
    );
    return response.total > 0;
  } catch (error) {
    throw error;
  }
};

export const editEvent = async (eventId, eventData) => {
  try {
    // Remove any Appwrite internal fields and ensure numberOfHours is a string
    const sanitizedEventData = {
      eventName: eventData.eventName,
      eventDate: eventData.eventDate,
      eventTimeFrom: eventData.eventTimeFrom,
      eventTimeTo: eventData.eventTimeTo,
      eventVenue: eventData.eventVenue,
      eventType: eventData.eventType,
      eventCategory: eventData.eventCategory,
      numberOfHours: String(eventData.numberOfHours),
    };

    // Remove any undefined or null values
    Object.keys(sanitizedEventData).forEach((key) => {
      if (
        sanitizedEventData[key] === undefined ||
        sanitizedEventData[key] === null
      ) {
        delete sanitizedEventData[key];
      }
    });

    const response = await databases.updateDocument(
      databaseId,
      eventCollectionId,
      eventId,
      sanitizedEventData
    );
    return response;
  } catch (error) {
    throw new Error("Failed to edit event.");
  }
};

export const deleteEvent = async (eventId) => {
  try {
    // Delete the document in the specified database and collection
    const response = await databases.deleteDocument(
      databaseId, // Database ID
      eventCollectionId, // Collection ID
      eventId // ID of the event to delete
    );
    return response; // Return response from the delete operation
  } catch (error) {
    throw new Error("Failed to delete event.");
  }
};

export const checkTimeConflict = async (
  eventDate,
  eventVenue,
  eventTimeFrom,
  eventTimeTo
) => {
  try {
    // Ensure we have a valid date to work with
    const date = new Date(eventDate);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date provided");
    }

    // Format the date part (YYYY-MM-DD)
    const formattedDate = date.toISOString().split("T")[0];

    // Combine date with time for comparison
    const startDateTime = new Date(`${formattedDate}T${eventTimeFrom}`);
    const endDateTime = new Date(`${formattedDate}T${eventTimeTo}`);

    // Query existing events
    const existingEvents = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal("eventVenue", eventVenue),
        Query.equal("eventDate", formattedDate),
      ]
    );

    // Check for time conflicts
    for (const event of existingEvents.documents) {
      const existingStart = new Date(`${formattedDate}T${event.eventTimeFrom}`);
      const existingEnd = new Date(`${formattedDate}T${event.eventTimeTo}`);

      // Check if there's an overlap
      if (
        (startDateTime >= existingStart && startDateTime < existingEnd) ||
        (endDateTime > existingStart && endDateTime <= existingEnd) ||
        (startDateTime <= existingStart && endDateTime >= existingEnd)
      ) {
        return true; // Conflict found
      }
    }

    return false; // No conflict
  } catch (error) {
    throw error;
  }
};

export const createParticipant = async (participantData) => {
  try {
    console.log("Creating participant with data:", participantData);

    // Ensure all required fields are present
    const requiredFields = {
      eventId: participantData.eventId,
      name: participantData.name,
      createdBy: participantData.createdBy,
    };

    // Check if any required field is missing
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    const response = await databases.createDocument(
      databaseId,
      studentCollectionId,
      ID.unique(),
      participantData
    );

    console.log("Participant created successfully:", response);
    return response;
  } catch (error) {
    throw error;
  }
};

// Add to appwrite.js

export async function getAllEventsAndParticipants() {
  try {
    // First fetch all events
    const eventsResponse = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [Query.orderDesc("eventDate")]
    );

    // Then fetch all participants
    const participantsResponse = await databases.listDocuments(
      databaseId,
      studentCollectionId
    );

    return {
      events: eventsResponse.documents,
      participants: participantsResponse.documents,
    };
  } catch (error) {
    throw error;
  }
}

export const updateParticipant = async (participantId, updatedData) => {
  try {
    const response = await databases.updateDocument(
      databaseId,
      studentCollectionId,
      participantId,
      updatedData
    );
    return response;
  } catch (error) {
    throw error;
  }
};

const updateEventParticipants = async (eventId, participantId) => {
  try {
    // Fetch the current event document
    const event = await databases.getDocument(
      databaseId,
      eventCollectionId,
      eventId
    );

    // Prepare the updated participants array
    const updatedParticipants = [...(event.participants || []), participantId];

    // Update the event document
    await databases.updateDocument(databaseId, eventCollectionId, eventId, {
      participants: updatedParticipants,
    });
  } catch (error) {
    throw error;
  }
};

export const updateEvent = async (eventId, updateData) => {
  try {
    const updatedEvent = await databases.updateDocument(
      databaseId,
      eventCollectionId,
      eventId,
      updateData
    );
    return updatedEvent;
  } catch (error) {
    throw error;
  }
};

export const deleteParticipant = async (participantId, userId) => {
  try {
    // Verify user session first
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Fetch the participant to check ownership
    const participant = await databases.getDocument(
      databaseId,
      userCollectionId,
      participantId
    );

    // Check if the user is the creator or has admin rights
    if (
      participant.createdBy !== currentUser.$id &&
      currentUser.role !== "admin"
    ) {
      throw new Error("You don't have permission to delete this participant");
    }

    // Proceed with deletion
    await databases.deleteDocument(databaseId, userCollectionId, participantId);

    return true;
  } catch (error) {
    throw error;
  }
};

export async function getParticipantByStudentId(studentId) {
  try {
    const response = await databases.listDocuments(
      databaseId,
      studentCollectionId,
      [Query.equal("studentId", studentId)]
    );

    if (response.documents.length > 0) {
      return response.documents[0]; // Return the first matching document
    } else {
      return null; // Return null if no participant is found
    }
  } catch (error) {
    throw new Error("Error fetching participant by studentId");
  }
}

export async function fetchParticipantData(
  identifier,
  currentEventId,
  participantType
) {
  console.log("Starting fetchParticipantData with:", {
    identifier,
    currentEventId,
    participantType,
  });

  if (!identifier || !currentEventId || !participantType) {
    console.error("Missing required parameters:", {
      identifier,
      currentEventId,
      participantType,
    });
    return null;
  }

  try {
    // For students, we only need to check the studentCollectionId
    const query = [
      Query.equal(
        participantType === "student"
          ? "studentId"
          : participantType === "staff"
          ? "staffFacultyId"
          : "name",
        identifier
      ),
      Query.notEqual("eventId", currentEventId), // Exclude current event
    ];

    console.log("Querying with:", {
      databaseId,
      studentCollectionId,
      query,
    });

    const response = await databases.listDocuments(
      databaseId,
      studentCollectionId, // Always use studentCollectionId for all types
      query
    );

    console.log("Database response:", response);

    if (response.total > 0) {
      const participant = response.documents[0];
      console.log("Found participant in database:", participant);

      try {
        // Get the event name
        const event = await databases.getDocument(
          databaseId,
          eventCollectionId,
          participant.eventId
        );
        console.log("Found associated event:", event);

        // Return standardized participant data
        return {
          // Common fields
          name: participant.name,
          sex: participant.sex,
          age: participant.age,
          homeAddress: participant.homeAddress || participant.address,
          ethnicGroup: participant.ethnicGroup,
          otherEthnicGroup: participant.otherEthnicGroup,

          // Type-specific fields
          studentId: participant.studentId,
          staffFacultyId: participant.staffFacultyId,
          school: participant.school,
          year: participant.year,
          section: participant.section,

          // Event information
          eventId: participant.eventId,
          eventName: event.eventName,
          participantType: participantType,
        };
      } catch (eventError) {
        console.error("Error fetching event details:", eventError);
        return null;
      }
    } else {
      console.log("No matching participant found");
      return null;
    }
  } catch (error) {
    console.error("Error in fetchParticipantData:", error);
    return null;
  }
}

// Add this helper function to check for duplicate participants
export const checkDuplicateParticipant = async (
  eventId,
  identifier,
  type = "student"
) => {
  try {
    let collectionId;
    switch (type) {
      case "student":
        collectionId = studentCollectionId;
        break;
      case "staff":
        collectionId = staffFacultyCollectionId;
        break;
      case "community":
        collectionId = communityCollectionId;
        break;
      default:
        collectionId = studentCollectionId;
    }

    const response = await databases.listDocuments(databaseId, collectionId, [
      Query.equal("eventId", eventId),
      Query.equal("$id", identifier),
    ]);

    return response.documents.length > 0;
  } catch (error) {
    throw error;
  }
};

export function subscribeToRealTimeUpdates(collectionId, callback) {
  if (!databaseId || !collectionId) {
    console.error("Missing databaseId or collectionId for subscription.");
    return () => {}; // Return a no-op function if invalid
  }

  const unsubscribe = client.subscribe(
    `databases.${databaseId}.collections.${collectionId}.documents`,
    (response) => {
      if (response.events.includes("databases.*.collections.*.documents.*")) {
        callback();
      }
    }
  );

  return () => {
    unsubscribe();
  };
}

export const subscribeToEventUpdates = (callback) => {
  return client.subscribe(
    `databases.${databaseId}.collections.${eventCollectionId}.documents`,
    (response) => {
      if (
        response.events.includes("databases.*.collections.*.documents.*.update")
      ) {
        callback(response.payload);
      }
    }
  );
};

export async function changePassword(currentPassword, newPassword) {
  try {
    await account.updatePassword(newPassword, currentPassword);
  } catch (error) {
    throw error;
  }
}

export async function uploadAvatar(file) {
  try {
    const response = await storage.createFile("avatars", ID.unique(), file);
    return storage.getFileView("avatars", response.$id);
  } catch (error) {
    throw error;
  }
}

export async function deleteAvatar(fileId) {
  try {
    await storage.deleteFile("avatars", fileId);
  } catch (error) {
    throw error;
  }
}

export async function fetchTrendData(startDate, endDate) {
  try {
    const events = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.greaterThanEqual("eventDate", startDate),
        Query.lessThanEqual("eventDate", endDate),
      ]
    );

    const participants = await Promise.all(
      events.documents.map((event) =>
        databases.listDocuments(databaseId, studentCollectionId, [
          Query.equal("eventId", event.$id),
        ])
      )
    );

    return {
      events: events.documents,
      participants: participants.flatMap((p) => p.documents),
    };
  } catch (error) {
    throw error;
  }
}

export function processTrendData(data) {
  const eventParticipation = data.events.map((event) => ({
    date: event.eventDate,
    total: event.participants?.length || 0,
    male: data.participants.filter(
      (p) => p.eventId === event.$id && p.sex.toLowerCase() === "male"
    ).length,
    female: data.participants.filter(
      (p) => p.eventId === event.$id && p.sex.toLowerCase() === "female"
    ).length,
  }));

  const ageDistribution = processAgeData(data.participants);
  const ethnicDistribution = processEthnicData(data.participants);

  return {
    eventParticipation,
    ageDistribution,
    ethnicDistribution,
  };
}

function processAgeData(participants) {
  const ageGroups = {
    "Below 18": { male: 0, female: 0, total: 0 },
    "18-24": { male: 0, female: 0, total: 0 },
    "25-34": { male: 0, female: 0, total: 0 },
    "35-44": { male: 0, female: 0, total: 0 },
    "45-54": { male: 0, female: 0, total: 0 },
    "Above 55": { male: 0, female: 0, total: 0 },
  };

  participants.forEach((participant) => {
    const age = parseInt(participant.age);
    const sex = participant.sex?.toLowerCase() || "unknown";
    if (isNaN(age)) return; // Skip if age is not a valid number

    let ageGroup;
    if (age < 18) ageGroup = "Below 18";
    else if (age <= 24) ageGroup = "18-24";
    else if (age <= 34) ageGroup = "25-34";
    else if (age <= 44) ageGroup = "35-44";
    else if (age <= 54) ageGroup = "45-54";
    else ageGroup = "Above 55";

    if (sex === "male") ageGroups[ageGroup].male++;
    else if (sex === "female") ageGroups[ageGroup].female++;
    ageGroups[ageGroup].total++;
  });

  // Convert to array format for the chart
  return Object.entries(ageGroups).map(([name, counts]) => ({
    name,
    value: counts.total,
    male: counts.male,
    female: counts.female,
  }));
}

function processEthnicData(participants) {
  const ethnicCount = participants.reduce((acc, p) => {
    const group =
      p.ethnicGroup === "Other" ? p.otherEthnicGroup : p.ethnicGroup;
    const sex = p.sex.toLowerCase();
    if (!acc[group]) {
      acc[group] = { male: 0, female: 0 };
    }
    acc[group][sex]++;
    return acc;
  }, {});

  return Object.entries(ethnicCount).map(([name, value]) => ({
    name,
    male: value.male,
    female: value.female,
    total: value.male + value.female,
  }));
}

export async function fetchReportData() {
  try {
    const events = await databases.listDocuments(databaseId, eventCollectionId);
    const participants = await databases.listDocuments(
      databaseId,
      studentCollectionId
    );

    return {
      events: events.documents,
      participants: participants.documents,
    };
  } catch (error) {
    throw error;
  }
}

export function calculateKPIs(data) {
  const totalParticipants = data.participants.length;
  const maleParticipants = data.participants.filter(
    (p) => p.sex.toLowerCase() === "male"
  ).length;
  const femaleParticipants = data.participants.filter(
    (p) => p.sex.toLowerCase() === "female"
  ).length;

  // Sort events by date
  const sortedEvents = data.events.sort(
    (a, b) => new Date(a.eventDate) - new Date(b.eventDate)
  );

  // Calculate growth rate
  const firstEventParticipants = sortedEvents[0].participants?.length || 0;
  const lastEventParticipants =
    sortedEvents[sortedEvents.length - 1].participants?.length || 0;
  const growthRate =
    ((lastEventParticipants - firstEventParticipants) /
      firstEventParticipants) *
    100;

  return {
    maleParticipation: (maleParticipants / totalParticipants) * 100,
    femaleParticipation: (femaleParticipants / totalParticipants) * 100,
    eventGrowthRate: growthRate,
  };
}

export const createStudent = async (studentData) => {
  try {
    const response = await databases.createDocument(
      databaseId,
      studentCollectionId,
      ID.unique(),
      studentData
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const getStudents = async (page = 1, limit = 10) => {
  try {
    const response = await databases.listDocuments(
      databaseId,
      studentCollectionId,
      [Query.limit(limit), Query.offset((page - 1) * limit)]
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateStudent = async (studentId, updatedData) => {
  try {
    const response = await databases.updateDocument(
      databaseId,
      studentCollectionId,
      studentId,
      updatedData
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteStudent = async (studentId) => {
  try {
    await databases.deleteDocument(databaseId, studentCollectionId, studentId);
  } catch (error) {
    throw error;
  }
};

export const createQuestion = async (questionData) => {
  return await databases.createDocument(
    databaseId,
    questionsCollectionId,
    ID.unique(),
    questionData
  );
};

export const listQuestions = async () => {
  return await databases.listDocuments(databaseId, questionsCollectionId);
};

export const updateQuestion = async (questionId, questionData) => {
  return await databases.updateDocument(
    databaseId,
    questionsCollectionId,
    questionId,
    questionData
  );
};

export const deleteQuestion = async (questionId) => {
  return await databases.deleteDocument(
    databaseId,
    questionsCollectionId,
    questionId
  );
};

export async function fetchQuestions() {
  try {
    const response = await databases.listDocuments(
      databaseId,
      questionsCollectionId
    );
    return response.documents;
  } catch (error) {
    throw error;
  }
}

export const createResponse = async (responseData) => {
  try {
    const response = await databases.createDocument(
      databaseId,
      responsesCollectionId,
      ID.unique(),
      responseData
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export async function saveResponse(responseData) {
  try {
    // Ensure the responseData object has the correct structure
    const validatedResponseData = {
      answer: responseData.answer,
      userId: responseData.userId,
      name: responseData.name,
      age: responseData.age,
      sex: responseData.sex,
      // Use 'question' instead of 'questionId' if that's the correct field name
      question: responseData.questionId,
      // Add any other fields that are expected in your responses collection
    };

    await databases.createDocument(
      databaseId,
      responsesCollectionId,
      ID.unique(),
      validatedResponseData
    );
  } catch (error) {
    throw error;
  }
}

export async function listResponses() {
  try {
    const response = await databases.listDocuments(
      databaseId,
      responsesCollectionId,
      [
        Query.limit(100), // Adjust this number based on your needs
      ]
    );

    if (response && response.documents) {
      return response.documents;
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
}

export async function updateResponse(responseId, updatedData) {
  try {
    const response = await databases.updateDocument(
      databaseId,
      responsesCollectionId,
      responseId,
      updatedData
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function deleteResponse(responseId) {
  try {
    await databases.deleteDocument(
      databaseId,
      responsesCollectionId,
      responseId
    );
  } catch (error) {
    throw error;
  }
}

const formatBirthDate = (birthDate) => {
  if (!birthDate) return "";
  const date = new Date(birthDate);
  return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

export const validateEmployeeData = (data, requiredFields) => {
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  // Format and sanitize data
  return {
    ...data,
    age: data.age ? String(data.age).slice(0, 1000) : "",
    birth: formatBirthDate(data.birth) || "Not provided",
    timeStamp: data.timeStamp || new Date().toISOString(),
    "genderIfNon-Heterosexual":
      data["genderIfNon-Heterosexual"] || "Not applicable",
  };
};

export async function processAndImportSingleEmployee(data) {
  const requiredFields = [
    "email",
    "name",
    "age",
    "address",
    "cpNumber",
    "sexAtBirth",
    "gender",
    "genderIfNon-Heterosexual",
  ];

  // Validate and sanitize employee data
  const employeeData = validateEmployeeData(data, requiredFields);

  try {
    // Import employee basic information
    const employee = await databases.createDocument(
      databaseId,
      employeesCollectionId,
      ID.unique(),
      {
        email: employeeData.email,
        name: employeeData.name,
        age: employeeData.age,
        birth: employeeData.birth,
        address: employeeData.address,
        cpNumber: employeeData.cpNumber,
        sexAtBirth: employeeData.sexAtBirth,
        gender: employeeData.gender,
        "genderIfNon-Heterosexual": employeeData["genderIfNon-Heterosexual"],
        timeStamp: employeeData.timeStamp,
      }
    );

    // Store questions and answers in the employeeSurvey collection
    if (data.questions && data.answers) {
      const surveyData = {
        employeeDataId: employee.$id,
        questions: data.questions,
        answers: data.answers,
      };

      // Create the document in the employeeSurvey collection
      await databases.createDocument(
        databaseId,
        employeesSurveyCollectionId,
        ID.unique(),
        surveyData
      );
    } else {
      console.warn(`No survey data for employee ${employee.$id}`);
    }

    return employee;
  } catch (error) {
    throw error;
  }
}

export async function importEmployeeDataInBatches(data, batchSize = 100) {
  const importLog = {
    total: data.length,
    successful: 0,
    failed: 0,
    failedRecords: [],
  };

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    try {
      const batchResults = await Promise.all(
        batch.map(async (record) => {
          try {
            return await processAndImportSingleEmployee(record);
          } catch (error) {
            console.error(
              `Error importing record: ${JSON.stringify(record)}`,
              error
            );
            return { error, record };
          }
        })
      );

      batchResults.forEach((result) => {
        if (result.error) {
          importLog.failed++;
          importLog.failedRecords.push({
            record: result.record,
            error: result.error.message,
          });
        } else {
          importLog.successful++;
        }
      });
    } catch (batchError) {
      console.error("Batch import error:", batchError);
    }
  }

  return importLog;
}

export async function fetchImportedFiles() {
  try {
    const response = await databases.listDocuments(
      databaseId,
      formsCollectionId
    );
    return response.documents;
  } catch (error) {
    throw error;
  }
}

export async function createFormDocument(data) {
  try {
    const response = await databases.createDocument(
      databaseId,
      formsCollectionId, // Make sure this is the correct collection ID for form documents
      ID.unique(),
      data
    );
    return response;
  } catch (error) {
    throw error;
  }
}

// Add these utility functions at the top level
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration
const BATCH_SIZE = 5; // Number of employees to process in parallel
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

// Cache for employee data
let employeeDataCache = {
  data: null,
  timestamp: null,
};

// Utility function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility function to fetch related data for a single employee with retries
const fetchEmployeeRelatedData = async (employee, retryCount = 3) => {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const [
        demographics,
        employment,
        genderAwareness,
        familyFinancial,
        childFamPlan,
        healthMedInfo,
        lifestyle,
        workplace,
        access,
        physical,
      ] = await Promise.all([
        databases.listDocuments(databaseId, demographicsCollectionId, [
          Query.equal("employeeId", employee.$id),
        ]),
        databases.listDocuments(databaseId, employmentDetailsCollectionId, [
          Query.equal("employeeId", employee.$id),
        ]),
        databases.listDocuments(databaseId, genderAwarenessCollectionId, [
          Query.equal("employeeId", employee.$id),
        ]),
        databases.listDocuments(databaseId, familyFinancialCollectionId, [
          Query.equal("employeeId", employee.$id),
        ]),
        databases.listDocuments(databaseId, childFamPlanCollectionId, [
          Query.equal("employeeId", employee.$id),
        ]),
        databases.listDocuments(databaseId, healthMedInfoCollectionId, [
          Query.equal("employeeId", employee.$id),
        ]),
        databases.listDocuments(databaseId, lifestyleCollectionId, [
          Query.equal("employeeId", employee.$id),
        ]),
        databases.listDocuments(databaseId, workplaceCollectionId, [
          Query.equal("employeeId", employee.$id),
        ]),
        databases.listDocuments(databaseId, accessCollectionId, [
          Query.equal("employeeId", employee.$id),
        ]),
        databases.listDocuments(databaseId, physicalCollectionId, [
          Query.equal("employeeId", employee.$id),
        ]),
      ]);

      return {
        ...employee,
        demographics: demographics.documents[0] || {},
        employment: employment.documents[0] || {},
        genderAwareness: genderAwareness.documents[0] || {},
        familyFinancial: familyFinancial.documents[0] || {},
        childFamPlan: childFamPlan.documents[0] || {},
        healthMedInfo: healthMedInfo.documents[0] || {},
        lifestyle: lifestyle.documents[0] || {},
        workplace: workplace.documents[0] || {},
        access: access.documents[0] || {},
        physical: physical.documents[0] || {},
      };
    } catch (error) {
      if (attempt === retryCount) {
        console.error(
          `Failed to fetch related data for employee ${employee.$id} after ${retryCount} attempts:`,
          error
        );
        return {
          ...employee,
          error: `Failed to fetch related data: ${error.message}`,
        };
      }
      await delay(1000 * attempt); // Exponential backoff
    }
  }
};

// Main function to get all employee data
export async function getAllEmployeeData(includeArchived = false) {
  try {
    const now = Date.now();
    if (
      !includeArchived &&
      employeeDataCache.data &&
      employeeDataCache.timestamp &&
      now - employeeDataCache.timestamp < CACHE_DURATION
    ) {
      return employeeDataCache.data;
    }

    const employees = await databases.listDocuments(
      databaseId,
      personalCollectionId,
      includeArchived ? [] : [Query.equal("isArchived", false)]
    );

    if (!employees.documents || employees.documents.length === 0) {
      return [];
    }

    const allEmployeeData = [];

    for (let i = 0; i < employees.documents.length; i += BATCH_SIZE) {
      const batch = employees.documents.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (employee) => {
          try {
            console.log("Fetching data for employee:", {
              employeeId: employee.employeeId,
              $id: employee.$id,
            });

            const [
              demographics,
              employment,
              genderAwareness,
              familyFinancial,
              childFamPlan,
              healthMedInfo,
              lifestyle,
              workplace,
              access,
              physical,
            ] = await Promise.all([
              databases
                .listDocuments(databaseId, demographicsCollectionId, [
                  Query.equal("employeeId", employee.employeeId),
                ])
                .then((response) => response.documents[0] || {}),
              getEmployeeTabData(
                employee.employeeId,
                employmentDetailsCollectionId
              ),
              getEmployeeTabData(
                employee.employeeId,
                genderAwarenessCollectionId
              ),
              getEmployeeTabData(
                employee.employeeId,
                familyFinancialCollectionId
              ),
              getEmployeeTabData(employee.employeeId, childFamPlanCollectionId),
              getEmployeeTabData(
                employee.employeeId,
                healthMedInfoCollectionId
              ),
              getEmployeeTabData(employee.employeeId, lifestyleCollectionId),
              getEmployeeTabData(employee.employeeId, workplaceCollectionId),
              getEmployeeTabData(employee.employeeId, accessCollectionId),
              getEmployeeTabData(employee.employeeId, physicalCollectionId),
            ]);

            console.log("Demographics data fetched:", {
              employeeId: employee.employeeId,
              demographics: demographics,
            });

            const employeeData = {
              ...employee,
              fullName:
                employee.fullName ||
                `${employee.firstName || ""} ${employee.middleName || ""} ${
                  employee.lastName || ""
                }`.trim(),
              demographics: {
                civilStatus: demographics?.civilStatus || "",
                sexAtBirth: demographics?.sexAtBirth || "",
                gender: demographics?.gender || "",
                nonHeterosexual: demographics?.nonHeterosexual || "",
                pwd: demographics?.pwd || false,
                pwdSpecify: demographics?.pwdSpecify || "",
                soloParent: demographics?.soloParent || false,
                ip: demographics?.ip || false,
                ipSpecify: demographics?.ipSpecify || "",
                year: demographics?.year || new Date().getFullYear().toString(),
              },
              employment,
              genderAwareness,
              familyFinancial,
              childFamPlan,
              healthMedInfo,
              lifestyle,
              workplace,
              access,
              physical,
            };

            return employeeData;
          } catch (error) {
            console.error("Error fetching employee data:", {
              employeeId: employee.employeeId,
              error: error.message,
            });
            return {
              ...employee,
              error: `Failed to fetch employee data: ${error.message}`,
              demographics: {
                civilStatus: "",
                sexAtBirth: "",
                gender: "",
                nonHeterosexual: "",
                pwd: false,
                pwdSpecify: "",
                soloParent: false,
                ip: false,
                ipSpecify: "",
                year: new Date().getFullYear().toString(),
              },
            };
          }
        })
      );

      allEmployeeData.push(...batchResults);

      if (i + BATCH_SIZE < employees.documents.length) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    if (!includeArchived) {
      employeeDataCache = {
        data: allEmployeeData,
        timestamp: now,
      };
    }

    return allEmployeeData;
  } catch (error) {
    throw error;
  }
}

// Add a function to clear the cache if needed
export const clearEmployeeDataCache = () => {
  employeeDataCache = {
    data: null,
    timestamp: null,
  };
};

export async function getEmployeeData(employeeId) {
  try {
    const employee = await databases.getDocument(
      databaseId,
      employeesCollectionId,
      employeeId
    );

    const surveyResponse = await databases.listDocuments(
      databaseId,
      employeesSurveyCollectionId,
      [Query.equal("employeeDataId", employeeId)]
    );

    return {
      ...employee,
      surveyData: surveyResponse.documents[0],
    };
  } catch (error) {
    throw error;
  }
}

// src/lib/appwrite.js

// Add these functions to your existing appwrite.js
// In src/lib/appwrite.js

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  actionType = null,
  status = "pending",
  approvalStatus = "pending",
  read = false,
}) => {
  try {
    if (!userId || !type || !title || !message) {
      throw new Error("Missing required notification fields");
    }

    if (!notificationsCollectionId) {
      throw new Error("Notifications collection ID is not configured");
    }

    const notificationData = {
      userId,
      type,
      title,
      message,
      actionType,
      status,
      approvalStatus,
      read,
      timestamp: new Date().toISOString(),
    };

    const response = await databases.createDocument(
      databaseId,
      notificationsCollectionId,
      ID.unique(),
      notificationData
    );

    return response;
  } catch (error) {
    return null;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await databases.updateDocument(
      databaseId,
      notificationsCollectionId,
      notificationId,
      {
        read: true,
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const getNotifications = async (userId, role) => {
  try {
    let queries = [Query.orderDesc("$createdAt")];

    if (role === "admin") {
      queries.push(
        Query.or(
          Query.equal("type", "approval"),
          Query.equal("type", "account"),
          Query.equal("type", "info")
        )
      );
    } else {
      queries.push(Query.equal("userId", userId));
    }

    const response = await databases.listDocuments(
      databaseId,
      notificationsCollectionId,
      queries
    );
    return response.documents;
  } catch (error) {
    throw error;
  }
};

// Helper functions for specific notification types
export const notifyAccountCreation = async (userId, userName) => {
  await createNotification({
    type: "account",
    title: "New Account Created",
    message: `New user ${userName} has registered.`,
    userId: userId,
  });
};

export const notifyAccountUpdate = async (userId, userName) => {
  await createNotification({
    type: "account",
    title: "Account Updated",
    message: `User ${userName} has updated their profile.`,
    userId: userId,
  });
};

export const notifyEventCreation = async (userId, eventName) => {
  await createNotification({
    type: "event",
    title: "New Event Created",
    message: `New event "${eventName}" has been created and is pending approval.`,
    userId: userId,
  });
};

export const notifyEventStatusChange = async (userId, eventName, status) => {
  await createNotification({
    type: "approval",
    title: "Event Status Updated",
    message: `Event "${eventName}" has been ${status}.`,
    userId: userId,
  });
};

export const fetchNotifications = async (userId, filters = []) => {
  try {
    const queries = [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
      ...filters,
    ];

    const response = await databases.listDocuments(
      databaseId,
      notificationsCollectionId,
      queries
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// Add these helper functions for dashboard calculations
const calculateSexDistribution = (participants) => {
  console.log("Starting sex distribution calculation with participants:", {
    totalParticipants: participants.length,
    participantTypes: participants.map((p) => p.participantType),
    sexValues: participants.map((p) => p.sexAtBirth),
  });

  // Count all participants by sex, including all participant types
  const maleCount = participants.filter(
    (p) => p.sexAtBirth?.toLowerCase() === "male"
  ).length;

  const femaleCount = participants.filter(
    (p) => p.sexAtBirth?.toLowerCase() === "female"
  ).length;

  const total = maleCount + femaleCount;

  console.log("Initial sex counts:", {
    maleCount,
    femaleCount,
    total,
    unaccountedFor: participants.length - total,
  });

  // Calculate detailed breakdowns
  const maleDetails = {
    students: participants.filter(
      (p) =>
        p.sexAtBirth?.toLowerCase() === "male" &&
        p.participantType === "Student"
    ).length,
    staffFaculty: participants.filter(
      (p) =>
        p.sexAtBirth?.toLowerCase() === "male" &&
        p.participantType === "Staff/Faculty"
    ).length,
    community: participants.filter(
      (p) =>
        p.sexAtBirth?.toLowerCase() === "male" &&
        p.participantType === "Community Member"
    ).length,
  };

  const femaleDetails = {
    students: participants.filter(
      (p) =>
        p.sexAtBirth?.toLowerCase() === "female" &&
        p.participantType === "Student"
    ).length,
    staffFaculty: participants.filter(
      (p) =>
        p.sexAtBirth?.toLowerCase() === "female" &&
        p.participantType === "Staff/Faculty"
    ).length,
    community: participants.filter(
      (p) =>
        p.sexAtBirth?.toLowerCase() === "female" &&
        p.participantType === "Community Member"
    ).length,
  };

  console.log("Detailed breakdown:", {
    male: maleDetails,
    female: femaleDetails,
    totals: {
      students: maleDetails.students + femaleDetails.students,
      staffFaculty: maleDetails.staffFaculty + femaleDetails.staffFaculty,
      community: maleDetails.community + femaleDetails.community,
    },
  });

  // Return the distribution with detailed counts and total
  const distribution = [
    {
      name: "Male",
      value: maleCount,
      total: total,
      details: maleDetails,
    },
    {
      name: "Female",
      value: femaleCount,
      total: total,
      details: femaleDetails,
    },
  ];

  console.log("Final distribution data:", distribution);

  return distribution;
};

const calculateAgeDistribution = (participants) => {
  // Initialize age groups with counts
  const ageGroups = {
    "Below 18": { male: 0, female: 0, total: 0 },
    "18-24": { male: 0, female: 0, total: 0 },
    "25-34": { male: 0, female: 0, total: 0 },
    "35-44": { male: 0, female: 0, total: 0 },
    "45-54": { male: 0, female: 0, total: 0 },
    "Above 55": { male: 0, female: 0, total: 0 },
  };

  // Count participants in each age group
  participants.forEach((participant) => {
    const age = parseInt(participant.age);
    const sex = participant.sex?.toLowerCase() || "unknown";
    if (isNaN(age)) return; // Skip if age is not a valid number

    let ageGroup;
    if (age < 18) ageGroup = "Below 18";
    else if (age <= 24) ageGroup = "18-24";
    else if (age <= 34) ageGroup = "25-34";
    else if (age <= 44) ageGroup = "35-44";
    else if (age <= 54) ageGroup = "45-54";
    else ageGroup = "Above 55";

    if (sex === "male") ageGroups[ageGroup].male++;
    else if (sex === "female") ageGroups[ageGroup].female++;
    ageGroups[ageGroup].total++;
  });

  // Convert to array format for the chart
  return Object.entries(ageGroups).map(([name, counts]) => ({
    name,
    value: counts.total,
    male: counts.male,
    female: counts.female,
  }));
};

const calculateLocationDistribution = (participants) => {
  const locations = {};

  participants.forEach((participant) => {
    const location = participant.address || "Not Specified";
    const sex = participant.sex?.toLowerCase() || "unknown";

    // Clean up the location string and capitalize first letter of each word
    const formattedLocation = location
      .split(",")[0] // Take only the first part before comma if exists
      .trim()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    if (!locations[formattedLocation]) {
      locations[formattedLocation] = {
        male: 0,
        female: 0,
        total: 0,
      };
    }

    if (sex === "male") locations[formattedLocation].male++;
    else if (sex === "female") locations[formattedLocation].female++;
    locations[formattedLocation].total++;
  });

  // Convert to array format and sort by count
  return Object.entries(locations)
    .map(([name, counts]) => ({
      name,
      value: counts.total,
      male: counts.male,
      female: counts.female,
    }))
    .sort((a, b) => b.value - a.value) // Sort by total count in descending order
    .slice(0, 10); // Only take top 10 locations
};

export const fetchTotals = async (academicPeriodId) => {
  try {
    // Fetch all events
    const eventsResponse = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal("academicPeriodId", academicPeriodId),
        Query.equal("isArchived", false),
        Query.orderDesc("$createdAt"),
      ]
    );
    const events = eventsResponse.documents;

    // Fetch all employees with their personal information
    const personalResponse = await databases.listDocuments(
      databaseId,
      process.env.NEXT_PUBLIC_APPWRITE_EPERSONAL_COLLECTION_ID,
      [Query.equal("isArchived", false)]
    );
    const employees = personalResponse.documents;

    // Fetch employment details for all employees
    const employmentDetails = await Promise.all(
      employees.map(async (employee) => {
        const employmentResponse = await databases.listDocuments(
          databaseId,
          process.env.NEXT_PUBLIC_APPWRITE_EEMPLOYMENT_DETAILS_COLLECTION_ID,
          [Query.equal("employeeId", employee.employeeId)]
        );
        return employmentResponse.documents[0] || null;
      })
    );

    // Process employment details to get positions and departments
    const positions = {};
    const departments = {};
    employmentDetails.forEach((detail) => {
      if (detail) {
        // Count positions (eStatus)
        const position = detail.eStatus || "Unspecified";
        positions[position] = (positions[position] || 0) + 1;

        // Count departments (office)
        const department = detail.office || "Unspecified";
        departments[department] = (departments[department] || 0) + 1;
      }
    });

    // Calculate event totals
    const totalEvents = events.length;
    const academicEvents = events.filter(
      (event) => event.eventType === "Academic"
    ).length;
    const nonAcademicEvents = events.filter(
      (event) => event.eventType === "Non-Academic"
    ).length;
    const totalEmployees = employees.length;

    // Calculate distributions
    const sexDistribution = calculateSexDistribution(employees);
    const ageDistribution = calculateAgeDistribution(employees);
    const locationDistribution = calculateLocationDistribution(employees);

    // Sort positions and departments by count
    const sortedPositions = Object.entries(positions)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const sortedDepartments = Object.entries(departments)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalEvents,
      academicEvents,
      nonAcademicEvents,
      totalEmployees,
      sexDistribution,
      ageDistribution,
      locationDistribution,
      positions: sortedPositions,
      departments: sortedDepartments,
    };
  } catch (error) {
    console.error("Error in fetchTotals:", error);
    throw error;
  }
};

export const logActivity = async (userId, activityType) => {
  try {
    console.log("Logging activity:", {
      userId,
      activityType,
      timestamp: new Date().toISOString(),
    });

    const activity = await databases.createDocument(
      databaseId,
      process.env.NEXT_PUBLIC_APPWRITE_ACTIVITY_COLLECTION_ID,
      "unique()",
      {
        userId: userId,
        activityType: activityType,
        timestamp: new Date().toISOString(),
      }
    );

    console.log("Activity logged successfully:", {
      activityId: activity.$id,
      userId: activity.userId,
      activityType: activity.activityType,
    });

    return activity;
  } catch (error) {
    console.error("Activity Logging Error:", {
      error: {
        code: error.code,
        message: error.message,
        type: error.type,
        response: error.response,
        stack: error.stack,
      },
      userId,
      activityType,
      timestamp: new Date().toISOString(),
    });
    // Don't throw the error, just log it
    return null;
  }
};

// Function to log sign out
export const logSignOut = async (userId) => {
  await logActivity(userId, "Sign Out");
};

// Function to log event creation
export const logEventCreation = async (userId, eventName) => {
  await logActivity(userId, "Created Event: " + eventName);
};

// Function to log participant addition
export const logParticipantAdded = async (
  userId,
  eventName,
  participantName
) => {
  await logActivity(
    userId,
    `Added Participant: ${participantName} to ${eventName}`
  );
};

export const logSignOutActivity = async (userId, userRole) => {
  try {
    await databases.createDocument(
      databaseId,
      process.env.NEXT_PUBLIC_APPWRITE_ACTIVITY_LOGS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        activityType: `${userRole} Sign Out`,
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {}
};

export const updateUserStatus = async (userId, newStatus) => {
  try {
    if (!databaseId || !process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID) {
      throw new Error("Database or Collection ID not configured");
    }

    const response = await databases.updateDocument(
      databaseId,
      process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
      userId,
      {
        approvalStatus: newStatus,
      }
    );

    return response;
  } catch (error) {
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    console.log("Fetching users with:", {
      databaseId: databaseId,
      userCollectionId: userCollectionId,
    });

    if (!databaseId || !userCollectionId) {
      throw new Error("Database or Collection ID not configured");
    }

    const response = await databases.listDocuments(
      databaseId,
      userCollectionId
    );

    return response.documents;
  } catch (error) {
    throw error;
  }
};

// Fetch activity logs function
export async function fetchActivityLogs() {
  try {
    const response = await databases.listDocuments(
      databaseId,
      activityLogsCollectionId,
      [Query.orderDesc("timestamp"), Query.limit(1000)]
    );
    return response.documents;
  } catch (error) {
    throw error;
  }
}

export const checkConnection = async () => {
  try {
    await client.health.get();
    return true;
  } catch (error) {
    return false;
  }
};

export const listEvents = async () => {
  try {
    const response = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(100), // Adjust limit as needed
      ]
    );

    // For each event, fetch its participants
    const eventsWithParticipants = await Promise.all(
      response.documents.map(async (event) => {
        try {
          const participants = await databases.listDocuments(
            databaseId,
            studentCollectionId,
            [
              Query.equal("eventId", event.$id),
              Query.limit(100), // Adjust limit as needed
            ]
          );
          return {
            ...event,
            participants: participants.documents,
          };
        } catch (error) {
          return {
            ...event,
            participants: [],
          };
        }
      })
    );

    return eventsWithParticipants;
  } catch (error) {
    throw error;
  }
};
// Add this new function to log user registrations
export const logUserRegistration = async (userId, name) => {
  await logActivity(userId, "User Registered: " + name);
};

export const updateEventVisibility = async (eventId, showOnHomepage) => {
  try {
    const response = await databases.updateDocument(
      databaseId,
      eventCollectionId,
      eventId,
      {
        showOnHomepage: showOnHomepage,
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const getDocumentsForCurrentPeriod = async (
  collectionId,
  queries = []
) => {
  const currentPeriod = await getCurrentAcademicPeriod();

  if (!currentPeriod) {
    throw new Error("No active academic period found");
  }

  return databases.listDocuments(databaseId, collectionId, [
    Query.greaterThanEqual("createdAt", currentPeriod.startDate),
    Query.lessThanEqual("createdAt", currentPeriod.endDate),
    ...queries,
  ]);
};

export const PERIOD_TYPES = {
  FIRST_SEMESTER: "First Semester",
  SECOND_SEMESTER: "Second Semester",
  SUMMER: "Summer",
};

// Function to check for duplicate academic periods
export const checkDuplicateAcademicPeriod = async (
  schoolYear,
  periodType,
  startDate,
  endDate
) => {
  try {
    console.log("Checking for duplicates with:", {
      schoolYear,
      periodType,
      startDate,
      endDate,
    });

    // Check for duplicates within the same school year
    const sameSchoolYearResponse = await databases.listDocuments(
      databaseId,
      academicPeriodCollectionId,
      [Query.equal("schoolYear", schoolYear), Query.equal("isActive", true)]
    );

    console.log(
      "Found periods in same school year:",
      sameSchoolYearResponse.documents
    );

    // Check if there's already a period with the same type in this school year
    const sameTypeInYear = sameSchoolYearResponse.documents.find(
      (period) => period.periodType === periodType
    );

    if (sameTypeInYear) {
      console.log("Found duplicate period type:", sameTypeInYear);
      return {
        isDuplicate: true,
        message: `An active academic period with period type "${periodType}" already exists in school year "${schoolYear}".`,
      };
    }

    // Check for overlapping date ranges (across all school years)
    const overlappingResponse = await databases.listDocuments(
      databaseId,
      academicPeriodCollectionId,
      [
        Query.equal("isActive", true),
        Query.lessThanEqual("startDate", endDate),
        Query.greaterThanEqual("endDate", startDate),
      ]
    );

    console.log("Found overlapping periods:", overlappingResponse.documents);

    if (overlappingResponse.documents.length > 0) {
      const overlappingPeriod = overlappingResponse.documents[0];
      return {
        isDuplicate: true,
        message: `The date range overlaps with an existing academic period (${overlappingPeriod.schoolYear} ${overlappingPeriod.periodType}). Please choose different dates.`,
      };
    }

    // Check for exact date matches within the same school year
    const exactDateMatch = sameSchoolYearResponse.documents.find(
      (period) => period.startDate === startDate && period.endDate === endDate
    );

    if (exactDateMatch) {
      console.log("Found exact date match:", exactDateMatch);
      return {
        isDuplicate: true,
        message: `An academic period with the same start and end dates already exists in school year "${schoolYear}".`,
      };
    }

    console.log("No duplicates found");
    return { isDuplicate: false };
  } catch (error) {
    console.error("Error checking for duplicate academic period:", error);
    throw new Error("Failed to check for duplicate academic periods");
  }
};

export const createAcademicPeriod = async (
  startDate,
  endDate,
  schoolYear,
  periodType,
  createdBy = null
) => {
  console.log("🚀 createAcademicPeriod called with:", {
    startDate,
    endDate,
    schoolYear,
    periodType,
    createdBy,
  });

  try {
    // Get current user if createdBy is not provided
    let currentUser = createdBy;
    if (!currentUser) {
      console.log("🔍 Getting current user for createdBy field...");
      try {
        const user = await getCurrentUser();
        currentUser = user ? user.$id : null;
        console.log("Current user ID:", currentUser);
      } catch (error) {
        console.warn("Could not get current user for createdBy field:", error);
        currentUser = null;
      }
    }

    console.log("🔍 Creating document with data:", {
      startDate,
      endDate,
      schoolYear,
      periodType,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
    });

    console.log("🔍 Using database ID:", databaseId);
    console.log("🔍 Using collection ID:", academicPeriodCollectionId);

    const result = await databases.createDocument(
      databaseId,
      academicPeriodCollectionId,
      "unique()",
      {
        startDate,
        endDate,
        schoolYear,
        periodType,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: currentUser,
      }
    );

    console.log("✅ Academic period created successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Error in createAcademicPeriod:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response,
    });
    throw error;
  }
};

export const archiveCurrentPeriod = async (periodId) => {
  try {
    return await databases.updateDocument(
      databaseId,
      academicPeriodCollectionId,
      periodId,
      {
        isActive: false,
        archivedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    throw error;
  }
};

export const getCurrentAcademicPeriod = async () => {
  try {
    console.log("Getting current academic period...");
    console.log("Using database ID:", databaseId);
    console.log(
      "Using academic period collection ID:",
      academicPeriodCollectionId
    );

    const response = await databases.listDocuments(
      databaseId,
      academicPeriodCollectionId,
      [Query.equal("isActive", true)]
    );

    console.log("Academic period response:", response);

    if (!response || !response.documents || response.documents.length === 0) {
      console.log("No active academic period found");
      return null;
    }

    const currentPeriod = response.documents[0];
    console.log("Found current period:", currentPeriod);

    // Validate dates
    const now = new Date();
    const startDate = new Date(currentPeriod.startDate);
    const endDate = new Date(currentPeriod.endDate);

    console.log("Date validation:", {
      now: now.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isBeforeStart: now < startDate,
      isAfterEnd: now > endDate,
    });

    return currentPeriod;
  } catch (error) {
    console.error("Error getting current academic period:", error);
    throw error;
  }
};

// Function to archive current data when creating new academic period
export const archiveCurrentPeriodData = async (oldPeriodId, newPeriodId) => {
  try {
    console.log("Starting archive process for period:", oldPeriodId);

    // Check if there are any documents to archive
    const [
      eventsResponse,
      studentsResponse,
      staffFacultyResponse,
      communityResponse,
    ] = await Promise.all([
      databases
        .listDocuments(databaseId, eventCollectionId, [
          Query.equal("isArchived", false),
        ])
        .catch(() => ({ documents: [] })),
      databases
        .listDocuments(databaseId, studentCollectionId, [
          Query.equal("isArchived", false),
        ])
        .catch(() => ({ documents: [] })),
      databases
        .listDocuments(databaseId, staffFacultyCollectionId, [
          Query.equal("isArchived", false),
        ])
        .catch(() => ({ documents: [] })),
      databases
        .listDocuments(databaseId, communityCollectionId, [
          Query.equal("isArchived", false),
        ])
        .catch(() => ({ documents: [] })),
    ]);

    console.log("Documents to archive:", {
      events: eventsResponse.documents.length,
      students: studentsResponse.documents.length,
      staffFaculty: staffFacultyResponse.documents.length,
      community: communityResponse.documents.length,
    });

    // Prepare all update operations
    const updateOperations = [];

    // Archive events
    if (eventsResponse.documents.length > 0) {
      const eventUpdates = eventsResponse.documents.map((event) =>
        databases
          .updateDocument(databaseId, eventCollectionId, event.$id, {
            isArchived: true,
            academicPeriodId: oldPeriodId,
            archivedAt: new Date().toISOString(),
          })
          .catch((error) => {
            console.warn(`Failed to archive event ${event.$id}:`, error);
            return null;
          })
      );
      updateOperations.push(...eventUpdates);
    }

    // Archive students
    if (studentsResponse.documents.length > 0) {
      const studentUpdates = studentsResponse.documents.map((student) =>
        databases
          .updateDocument(databaseId, studentCollectionId, student.$id, {
            isArchived: true,
            academicPeriodId: oldPeriodId,
            archivedAt: new Date().toISOString(),
          })
          .catch((error) => {
            console.warn(`Failed to archive student ${student.$id}:`, error);
            return null;
          })
      );
      updateOperations.push(...studentUpdates);
    }

    // Archive staff/faculty
    if (staffFacultyResponse.documents.length > 0) {
      const staffUpdates = staffFacultyResponse.documents.map((staff) =>
        databases
          .updateDocument(databaseId, staffFacultyCollectionId, staff.$id, {
            isArchived: true,
            academicPeriodId: oldPeriodId,
            archivedAt: new Date().toISOString(),
          })
          .catch((error) => {
            console.warn(`Failed to archive staff ${staff.$id}:`, error);
            return null;
          })
      );
      updateOperations.push(...staffUpdates);
    }

    // Archive community members
    if (communityResponse.documents.length > 0) {
      const communityUpdates = communityResponse.documents.map((member) =>
        databases
          .updateDocument(databaseId, communityCollectionId, member.$id, {
            isArchived: true,
            academicPeriodId: oldPeriodId,
            archivedAt: new Date().toISOString(),
          })
          .catch((error) => {
            console.warn(
              `Failed to archive community member ${member.$id}:`,
              error
            );
            return null;
          })
      );
      updateOperations.push(...communityUpdates);
    }

    // Execute all updates if there are any
    if (updateOperations.length > 0) {
      console.log(`Executing ${updateOperations.length} archive operations...`);
      const results = await Promise.allSettled(updateOperations);

      // Log results
      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;

      console.log(
        `Archive operation completed: ${successful} successful, ${failed} failed`
      );

      if (failed > 0) {
        console.warn(
          `${failed} archive operations failed, but continuing with period creation`
        );
      }
    } else {
      console.log("No documents to archive");
    }

    return true;
  } catch (error) {
    console.error("Error in archiveCurrentPeriodData:", error);
    // Don't throw error, just log it and continue
    console.warn(
      "Archive operation failed, but continuing with period creation"
    );
    return false;
  }
};

// Function to validate academic period data
export const validateAcademicPeriod = (
  schoolYear,
  periodType,
  startDate,
  endDate
) => {
  console.log("🔍 validateAcademicPeriod called with:", {
    schoolYear,
    periodType,
    startDate,
    endDate,
  });

  const errors = [];

  if (!schoolYear) {
    console.log("❌ School year is missing");
    errors.push("School year is required");
  }

  if (!periodType) {
    console.log("❌ Period type is missing");
    errors.push("Period type is required");
  }

  if (!startDate) {
    console.log("❌ Start date is missing");
    errors.push("Start date is required");
  }

  if (!endDate) {
    console.log("❌ End date is missing");
    errors.push("End date is required");
  }

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    console.log("❌ Start date is not before end date");
    errors.push("Start date must be before end date");
  }

  console.log("✅ Validation completed. Errors:", errors);
  return errors;
};

// Function to create a new academic period with data archival
export const createNewAcademicPeriod = async (
  schoolYear,
  periodType,
  startDate,
  endDate,
  currentPeriodId
) => {
  try {
    console.log("Creating new academic period with:", {
      schoolYear,
      periodType,
      startDate,
      endDate,
      currentPeriodId,
    });

    // Check for duplicates first
    const duplicateCheck = await checkDuplicateAcademicPeriod(
      schoolYear,
      periodType,
      startDate,
      endDate
    );

    console.log("Duplicate check result:", duplicateCheck);

    if (duplicateCheck.isDuplicate) {
      throw new Error(duplicateCheck.message);
    }

    // Get current user for createdBy field
    let currentUser = null;
    try {
      const user = await getCurrentUser();
      currentUser = user ? user.$id : null;
      console.log("Current user for createdBy:", currentUser);
    } catch (error) {
      console.warn("Could not get current user:", error);
    }

    // First archive the current period if it exists
    if (currentPeriodId) {
      console.log("Archiving current period:", currentPeriodId);
      await archiveCurrentPeriod(currentPeriodId);
    }

    // Create new period with createdBy field
    console.log("Creating new academic period...");
    const newPeriod = await createAcademicPeriod(
      startDate,
      endDate,
      schoolYear,
      periodType,
      currentUser
    );

    console.log("New period created successfully:", newPeriod.$id);

    // Archive current data (non-blocking)
    try {
      console.log("Starting data archival process...");
      const archiveResult = await archiveCurrentPeriodData(
        currentPeriodId,
        newPeriod.$id
      );
      console.log("Archive result:", archiveResult);
    } catch (archiveError) {
      console.warn(
        "Archive operation failed, but period was created:",
        archiveError
      );
      // Don't fail the entire operation if archiving fails
    }

    // Notify officers about new period (non-blocking)
    try {
      await notifyOfficersAboutAcademicPeriod(
        ACADEMIC_PERIOD_NOTIFICATIONS.NEW_PERIOD_CREATED,
        newPeriod
      );
    } catch (notificationError) {
      console.warn(
        "Notification failed, but period was created:",
        notificationError
      );
      // Don't fail the entire operation if notification fails
    }

    return newPeriod;
  } catch (error) {
    console.error("Error creating new academic period:", error);
    throw error;
  }
};

// Event Management Functions
export const fetchOfficerEvents = async (accountId) => {
  try {
    // Get current academic period
    const currentPeriod = await getCurrentAcademicPeriod();
    console.log("fetchOfficerEvents - currentPeriod:", currentPeriod);

    if (!currentPeriod) {
      console.log("No active academic period found in fetchOfficerEvents");
      return {
        events: [],
        currentPeriod: null,
      };
    }

    console.log("Fetching events with period:", currentPeriod.$id);

    const eventsResponse = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal("createdBy", accountId),
        Query.equal("isArchived", false),
        Query.equal("academicPeriodId", currentPeriod.$id),
        Query.orderDesc("$createdAt"),
      ]
    );

    console.log("Events response:", eventsResponse);

    return {
      events: eventsResponse.documents,
      currentPeriod,
    };
  } catch (error) {
    throw error;
  }
};

export const fetchEventParticipants = async (eventIds, academicPeriodId) => {
  try {
    const participantsResponse = await databases.listDocuments(
      databaseId,
      studentCollectionId,
      [
        Query.equal("isArchived", false),
        Query.equal("academicPeriodId", academicPeriodId),
        Query.equal("eventId", eventIds),
      ]
    );

    return participantsResponse.documents;
  } catch (error) {
    throw error;
  }
};

export const fetchEventOverviewData = async (userId) => {
  try {
    const currentPeriod = await getCurrentAcademicPeriod();
    if (!currentPeriod) {
      throw new Error("No active academic period found");
    }

    // Fetch events
    const eventsResponse = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal("createdBy", userId),
        Query.equal("academicPeriodId", currentPeriod.$id),
        Query.orderDesc("createdAt"),
      ]
    );

    if (eventsResponse.documents.length === 0) {
      return {
        events: [],
        participants: [],
        currentPeriod,
        summaryStats: {
          total: 0,
          academic: 0,
          nonAcademic: 0,
          totalParticipants: 0,
          maleParticipants: 0,
          femaleParticipants: 0,
        },
      };
    }

    // Get event IDs
    const eventIds = eventsResponse.documents.map((event) => event.$id);

    // Fetch participants with createdBy filter
    const participantsResponse = await databases.listDocuments(
      databaseId,
      studentCollectionId,
      [
        Query.equal("academicPeriodId", currentPeriod.$id),
        Query.equal("eventId", eventIds),
        Query.equal("createdBy", userId),
      ]
    );

    // Calculate summary stats
    const summaryStats = {
      total: eventsResponse.documents.length,
      academic: eventsResponse.documents.filter(
        (e) => e.eventType === "Academic"
      ).length,
      nonAcademic: eventsResponse.documents.filter(
        (e) => e.eventType === "Non-Academic"
      ).length,
      totalParticipants: participantsResponse.documents.length,
      maleParticipants: participantsResponse.documents.filter(
        (p) => p.sex === "Male"
      ).length,
      femaleParticipants: participantsResponse.documents.filter(
        (p) => p.sex === "Female"
      ).length,
    };

    return {
      events: eventsResponse.documents,
      participants: participantsResponse.documents,
      currentPeriod,
      summaryStats,
    };
  } catch (error) {
    throw error;
  }
};

export const fetchEventLogData = async (userId) => {
  try {
    const currentPeriod = await getCurrentAcademicPeriod();
    if (!currentPeriod) {
      throw new Error("No active academic period found");
    }

    const eventsResponse = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal("createdBy", userId),
        Query.equal("isArchived", false),
        Query.equal("academicPeriodId", currentPeriod.$id),
        Query.orderDesc("$createdAt"),
      ]
    );
    // ... rest of the function
  } catch (error) {
    throw error;
  }
};

// Add these new functions to handle event participant log operations

export const fetchEventParticipantLogData = async () => {
  try {
    console.log("Fetching event participant log data...");

    const [
      eventsResponse,
      participantsResponse,
      staffResponse,
      communityResponse,
    ] = await Promise.all([
      databases.listDocuments(databaseId, eventCollectionId),
      databases.listDocuments(databaseId, studentCollectionId, [
        Query.equal("isArchived", false),
      ]),
      databases.listDocuments(databaseId, staffFacultyCollectionId),
      databases.listDocuments(databaseId, communityCollectionId),
    ]);

    console.log("Fetched data:", {
      events: eventsResponse.documents.length,
      participants: participantsResponse.documents.length,
      staffFaculty: staffResponse.documents.length,
      community: communityResponse.documents.length,
    });

    return {
      events: eventsResponse.documents,
      participants: participantsResponse.documents,
      staffFaculty: staffResponse.documents,
      community: communityResponse.documents,
    };
  } catch (error) {
    throw error;
  }
};

export const getEventParticipantCounts = (
  eventId,
  participants,
  staffFaculty,
  community
) => {
  const studentParticipants = participants.filter((p) => p.eventId === eventId);
  const staffParticipants = staffFaculty.filter((p) => p.eventId === eventId);
  const communityParticipants = community.filter((p) => p.eventId === eventId);

  const allParticipants = [
    ...studentParticipants,
    ...staffParticipants,
    ...communityParticipants,
  ];
  const maleCount = allParticipants.filter((p) => p.sex === "Male").length;
  const femaleCount = allParticipants.filter((p) => p.sex === "Female").length;

  return {
    total: allParticipants.length,
    male: maleCount,
    female: femaleCount,
    students: studentParticipants.length,
    staffFaculty: staffParticipants.length,
    community: communityParticipants.length,
  };
};

export const getStaffFaculty = async (eventId = null) => {
  try {
    let query = [];

    // Add event filter if specified
    if (eventId) {
      query.push(Query.equal("eventId", eventId));
    }

    const response = await databases.listDocuments(
      databaseId,
      staffFacultyCollectionId,
      query
    );

    return response.documents;
  } catch (error) {
    throw error;
  }
};

export const getCommunityMembers = async (eventId = null) => {
  try {
    let query = [];

    // Add event filter if specified
    if (eventId) {
      query.push(Query.equal("eventId", eventId));
    }

    const response = await databases.listDocuments(
      databaseId,
      communityCollectionId,
      query
    );

    return response.documents;
  } catch (error) {
    throw error;
  }
};

// Add these constants for academic period notification types
export const ACADEMIC_PERIOD_NOTIFICATIONS = {
  PERIOD_ENDING: "period_ending",
  PERIOD_ENDED: "period_ended",
  NEW_PERIOD_CREATED: "new_period_created",
};

// Add this function to notify officers about academic period events
export const notifyOfficersAboutAcademicPeriod = async (type, periodData) => {
  try {
    // Get all users with officer role
    const officers = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.equal("role", "user")]
    );

    // Create notifications for each officer
    const notificationPromises = officers.documents.map((officer) => {
      let title, message;

      switch (type) {
        case ACADEMIC_PERIOD_NOTIFICATIONS.PERIOD_ENDING:
          title = "Academic Period Ending Soon";
          message = `The current ${periodData.periodType} (${
            periodData.schoolYear
          }) will end on ${new Date(periodData.endDate).toLocaleDateString()}`;
          break;
        case ACADEMIC_PERIOD_NOTIFICATIONS.PERIOD_ENDED:
          title = "Academic Period Ended";
          message = `The ${periodData.periodType} (${periodData.schoolYear}) has ended`;
          break;
        case ACADEMIC_PERIOD_NOTIFICATIONS.NEW_PERIOD_CREATED:
          title = "New Academic Period Created";
          message = `A new ${periodData.periodType} for ${periodData.schoolYear} has been created`;
          break;
        default:
          return null;
      }

      return createNotification({
        userId: officer.$id,
        type: "academic_period",
        title,
        message,
        actionType: type,
        status: "unread",
      });
    });

    await Promise.all(notificationPromises.filter(Boolean));
  } catch (error) {
    throw error;
  }
};

export const createOAuthSession = async (provider) => {
  try {
    const successUrl = `${window.location.origin}/auth-callback`;
    const failureUrl = `${window.location.origin}/sign-in`;

    // Define scopes based on provider
    const scopes =
      provider === "google"
        ? [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "openid",
          ]
        : ["email", "profile", "account"];

    console.log("Creating OAuth session with:", {
      provider,
      successUrl,
      failureUrl,
      scopes,
    });

    const session = await account.createOAuth2Session(
      provider,
      successUrl,
      failureUrl,
      scopes
    );

    console.log("OAuth session created successfully:", session);
    return session;
  } catch (error) {
    console.error("Error creating OAuth session:", error);
    throw error;
  }
};

export async function getAllAcademicPeriods() {
  try {
    const response = await databases.listDocuments(
      databaseId,
      academicPeriodCollectionId,
      [Query.orderDesc("$createdAt")] // Sort by creation date, newest first
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching academic periods:", error);
    throw error;
  }
}

// Function to get academic periods with filtering options
export async function getAcademicPeriods(filters = {}) {
  try {
    const queries = [];

    if (filters.isActive !== undefined) {
      queries.push(Query.equal("isActive", filters.isActive));
    }

    if (filters.schoolYear) {
      queries.push(Query.equal("schoolYear", filters.schoolYear));
    }

    if (filters.periodType) {
      queries.push(Query.equal("periodType", filters.periodType));
    }

    // Default to ordering by creation date
    queries.push(Query.orderDesc("$createdAt"));

    const response = await databases.listDocuments(
      databaseId,
      academicPeriodCollectionId,
      queries
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching academic periods with filters:", error);
    throw error;
  }
}

// Function to get academic periods by school year with detailed info
export async function getAcademicPeriodsBySchoolYear(schoolYear) {
  try {
    const response = await databases.listDocuments(
      databaseId,
      academicPeriodCollectionId,
      [Query.equal("schoolYear", schoolYear), Query.orderAsc("startDate")]
    );

    const formattedPeriods = response.documents.map((period) => ({
      ...period,
      startDateFormatted: new Date(period.startDate).toLocaleDateString(),
      endDateFormatted: new Date(period.endDate).toLocaleDateString(),
      isActive: period.isActive ? "Active" : "Archived",
    }));

    return formattedPeriods;
  } catch (error) {
    console.error("Error fetching academic periods by school year:", error);
    throw error;
  }
}

// Function to get archived academic periods
export async function getArchivedAcademicPeriods() {
  try {
    const response = await databases.listDocuments(
      databaseId,
      academicPeriodCollectionId,
      [
        Query.equal("isActive", false),
        Query.orderDesc("archivedAt"),
        Query.limit(100),
      ]
    );

    const formattedPeriods = response.documents.map((period) => ({
      ...period,
      startDateFormatted: new Date(period.startDate).toLocaleDateString(),
      endDateFormatted: new Date(period.endDate).toLocaleDateString(),
      archivedAtFormatted: period.archivedAt
        ? new Date(period.archivedAt).toLocaleDateString()
        : "Unknown",
      createdByFormatted: period.createdBy || "System",
    }));

    return formattedPeriods;
  } catch (error) {
    console.error("Error fetching archived academic periods:", error);
    throw error;
  }
}

// Function to check if a specific period type exists in a school year
export async function checkPeriodTypeExists(schoolYear, periodType) {
  try {
    const response = await databases.listDocuments(
      databaseId,
      academicPeriodCollectionId,
      [
        Query.equal("schoolYear", schoolYear),
        Query.equal("periodType", periodType),
        Query.equal("isActive", true),
      ]
    );

    return {
      exists: response.documents.length > 0,
      periods: response.documents,
    };
  } catch (error) {
    console.error("Error checking period type existence:", error);
    throw error;
  }
}

// Function to update employee archive status
export const updateEmployeeArchiveStatus = async (employeeId, isArchived) => {
  try {
    // Update the personal record
    await databases.updateDocument(
      databaseId,
      personalCollectionId,
      employeeId,
      {
        isArchived,
        archivedAt: isArchived ? new Date().toISOString() : null,
      }
    );

    // Get all related collection IDs
    const relatedCollections = [
      demographicsCollectionId,
      employmentDetailsCollectionId,
      genderAwarenessCollectionId,
      familyFinancialCollectionId,
      childFamPlanCollectionId,
      healthMedInfoCollectionId,
      lifestyleCollectionId,
      workplaceCollectionId,
      accessCollectionId,
      physicalCollectionId,
    ];

    // Update archive status in all related collections
    await Promise.all(
      relatedCollections.map(async (collectionId) => {
        try {
          const documents = await databases.listDocuments(
            databaseId,
            collectionId,
            [Query.equal("employeeId", employeeId)]
          );

          if (documents.documents.length > 0) {
            await databases.updateDocument(
              databaseId,
              collectionId,
              documents.documents[0].$id,
              {
                isArchived,
                archivedAt: isArchived ? new Date().toISOString() : null,
              }
            );
          }
        } catch (error) {}
      })
    );

    return true;
  } catch (error) {
    throw error;
  }
};

// Function to fetch data for specific employee tabs
export async function getEmployeeTabData(employeeId, collectionId) {
  try {
    const response = await databases.listDocuments(databaseId, collectionId, [
      Query.equal("employeeId", employeeId),
      Query.limit(1),
    ]);

    if (!response.documents || response.documents.length === 0) {
      if (collectionId === demographicsCollectionId) {
        return {
          civilStatus: "",
          sexAtBirth: "",
          gender: "",
          nonHeterosexual: "",
          pwd: false,
          pwdSpecify: "",
          soloParent: false,
          ip: false,
          ipSpecify: "",
          year: new Date().getFullYear().toString(),
        };
      }
      return {};
    }

    return response.documents[0];
  } catch (error) {
    if (collectionId === demographicsCollectionId) {
      return {
        civilStatus: "",
        sexAtBirth: "",
        gender: "",
        nonHeterosexual: "",
        pwd: false,
        pwdSpecify: "",
        soloParent: false,
        ip: false,
        ipSpecify: "",
        year: new Date().getFullYear().toString(),
      };
    }
    return {};
  }
}

// Function to fetch data for specific employee tab
export async function fetchEmployeeTabData(tabName, includeArchived = false) {
  try {
    let employees = [];

    switch (tabName) {
      case "personal":
        const personalResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = personalResponse.documents.map((employee) => ({
          id: employee.$id,
          fullName:
            employee.fullName ||
            `${employee.firstName || ""} ${employee.middleName || ""} ${
              employee.lastName || ""
            }`.trim(),
          employeeId: employee.employeeId || "",
          emailAddress: employee.emailAddress || "",
          age: employee.age || "",
          dateOfBirth: employee.dateOfBirth || employee.birthDate || "",
          address: employee.address || employee.residentialAddress || "",
          contactNumber: employee.contactNumber || employee.mobileNumber || "",
          year: employee.year || new Date().getFullYear().toString(),
        }));
        break;

      case "demographics":
        const baseResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = await Promise.all(
          baseResponse.documents.map(async (employee) => {
            const demographicsResponse = await databases.listDocuments(
              databaseId,
              demographicsCollectionId,
              [Query.equal("employeeId", employee.employeeId)]
            );

            const demographicsDoc = demographicsResponse.documents[0];

            const demographics = {
              civilStatus: demographicsDoc?.civilStatus || "",
              sexAtBirth: demographicsDoc?.sexAtBirth || "",
              gender: demographicsDoc?.gender || "",
              nonHeterosexual: demographicsDoc?.nonHeterosexual || "",
              pwd: demographicsDoc?.pwd || false,
              pwdSpecify: demographicsDoc?.pwdSpecify || "",
              soloParent: demographicsDoc?.soloParent || false,
              ip: demographicsDoc?.ip || false,
              ipSpecify: demographicsDoc?.ipSpecify || "",
              year:
                demographicsDoc?.year || new Date().getFullYear().toString(),
            };

            return {
              id: employee.$id,
              fullName:
                employee.fullName ||
                `${employee.firstName || ""} ${employee.middleName || ""} ${
                  employee.lastName || ""
                }`.trim(),
              employeeId: employee.employeeId || "",
              demographics: demographics,
            };
          })
        );
        break;

      case "employment":
        const employmentBaseResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = await Promise.all(
          employmentBaseResponse.documents.map(async (employee) => {
            console.log("Fetching employment details for employee:", {
              employeeId: employee.employeeId,
              fullName: employee.fullName,
            });

            const employmentResponse = await databases.listDocuments(
              databaseId,
              employmentDetailsCollectionId,
              [Query.equal("employeeId", employee.employeeId)]
            );

            console.log("Employment response:", {
              employeeId: employee.employeeId,
              found: employmentResponse.documents.length > 0,
              data: employmentResponse.documents[0],
            });

            const employmentDoc = employmentResponse.documents[0];

            return {
              id: employee.$id,
              $id: employee.$id,
              fullName: employee.fullName,
              employeeId: employee.employeeId || "",
              employmentStatus: employmentDoc?.eStatus || "",
              assignment: employmentDoc?.assignment || "",
              office: employmentDoc?.office || "",
              year: employmentDoc?.year || new Date().getFullYear().toString(),
            };
          })
        );
        break;

      case "gender":
        const genderBaseResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = await Promise.all(
          genderBaseResponse.documents.map(async (employee) => {
            const genderResponse = await databases.listDocuments(
              databaseId,
              genderAwarenessCollectionId,
              [Query.equal("employeeId", employee.employeeId)]
            );

            const genderDoc = genderResponse.documents[0];

            return {
              id: employee.$id,
              $id: employee.$id,
              fullName: employee.fullName,
              employeeId: employee.employeeId || "",
              awareGadAct: genderDoc?.awareGadAct || false,
              awareGadSpecify: genderDoc?.awareGadSpecify || "",
              participateGadAct: genderDoc?.participateGadAct || false,
              awareGadFbPage: genderDoc?.awareGadFbPage || false,
              visitedGadFbPage: genderDoc?.visitedGadFbPage || false,
              awareLaws: genderDoc?.awareLaws || false,
              year: genderDoc?.year || new Date().getFullYear().toString(),
            };
          })
        );
        break;

      case "family":
        const familyBaseResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = await Promise.all(
          familyBaseResponse.documents.map(async (employee) => {
            const familyResponse = await databases.listDocuments(
              databaseId,
              familyFinancialCollectionId,
              [Query.equal("employeeId", employee.employeeId)]
            );

            const familyDoc = familyResponse.documents[0];

            return {
              id: employee.$id,
              $id: employee.$id,
              fullName: employee.fullName,
              employeeId: employee.employeeId || "",
              totalIncome: familyDoc?.totalIncome || "",
              incomeSources: familyDoc?.incomeSources || "",
              majorContributor: familyDoc?.majorContributor || false,
              majorContributorSpecify: familyDoc?.majorContributorSpecify || "",
              soleFinanceManager: familyDoc?.soleFinanceManager || false,
              soleFinanceManagerSpecify:
                familyDoc?.soleFinanceManagerSpecify || "",
              householdSize: familyDoc?.householdSize || "",
              outsideSupport: familyDoc?.outsideSupport || "",
              hasSavings: familyDoc?.hasSavings || "No",
              year: familyDoc?.year || new Date().getFullYear().toString(),
            };
          })
        );
        break;

      case "children":
        const childrenBaseResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = await Promise.all(
          childrenBaseResponse.documents.map(async (employee) => {
            const childFamPlanResponse = await databases.listDocuments(
              databaseId,
              childFamPlanCollectionId,
              [Query.equal("employeeId", employee.employeeId)]
            );

            const childFamPlanDoc = childFamPlanResponse.documents[0];

            return {
              id: employee.$id,
              $id: employee.$id,
              fullName: employee.fullName,
              employeeId: employee.employeeId || "",
              hasChildren: childFamPlanDoc?.hasChildren || false,
              childrenAge0to6: childFamPlanDoc?.childrenAge0to6 || 0,
              childrenAge7to18: childFamPlanDoc?.childrenAge7to18 || 0,
              childrenAge18Plus: childFamPlanDoc?.childrenAge18Plus || 0,
              considerHavingChild:
                childFamPlanDoc?.considerHavingChild || false,
              wantMoreChildren: childFamPlanDoc?.wantMoreChildren || false,
              waitingPeriodNextChild:
                childFamPlanDoc?.waitingPeriodNextChild || "",
              averageAgeGapChildren:
                childFamPlanDoc?.averageAgeGapChildren || "",
              useDayCareServices: childFamPlanDoc?.useDayCareServices || false,
              needDayCareFacility:
                childFamPlanDoc?.needDayCareFacility || false,
              needLactationRoom: childFamPlanDoc?.needLactationRoom || false,
              year:
                childFamPlanDoc?.year || new Date().getFullYear().toString(),
            };
          })
        );
        break;

      case "health":
        const healthBaseResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = await Promise.all(
          healthBaseResponse.documents.map(async (employee) => {
            const healthMedResponse = await databases.listDocuments(
              databaseId,
              healthMedInfoCollectionId,
              [Query.equal("employeeId", employee.employeeId)]
            );

            const healthMedDoc = healthMedResponse.documents[0];

            return {
              id: employee.$id,
              $id: employee.$id,
              fullName: employee.fullName,
              employeeId: employee.employeeId || "",
              familyPlanning: healthMedDoc?.familyPlanning || false,
              contraceptiveMethod: healthMedDoc?.contraceptiveMethod || "",
              needFamilyPlanningInfo:
                healthMedDoc?.needFamilyPlanningInfo || false,
              performHouseholdActivities:
                healthMedDoc?.performHouseholdActivities || false,
              householdChoreHours: healthMedDoc?.householdChoreHours || "",
              householdMembersParticipate:
                healthMedDoc?.householdMembersParticipate || "",
              ownHouseProperty: healthMedDoc?.ownHouseProperty || false,
              houseOwnershipDetails: healthMedDoc?.houseOwnershipDetails || "",
              regularCheckup: healthMedDoc?.regularCheckup || false,
              familyCheckup: healthMedDoc?.familyCheckup || false,
              annualCheckup: healthMedDoc?.annualCheckup || false,
              bloodType: healthMedDoc?.bloodType || "",
              hasMedicalIllness: healthMedDoc?.hasMedicalIllness || false,
              hasMedicalIllnessSpecify:
                healthMedDoc?.hasMedicalIllnessSpecify || "",
              hospitalizedBefore: healthMedDoc?.hospitalizedBefore || false,
              hospitalizationYear: healthMedDoc?.hospitalizationYear || "",
              hadSurgery: healthMedDoc?.hadSurgery || false,
              surgeryYear: healthMedDoc?.surgeryYear || "",
              foodAllergies: healthMedDoc?.foodAllergies || "",
              medicineAllergies: healthMedDoc?.medicineAllergies || "",
              familyMedicalHistory: healthMedDoc?.familyMedicalHistory || "",
              year: healthMedDoc?.year || new Date().getFullYear().toString(),
            };
          })
        );
        break;

      case "lifestyle":
        const lifestyleBaseResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = await Promise.all(
          lifestyleBaseResponse.documents.map(async (employee) => {
            const lifestyleResponse = await databases.listDocuments(
              databaseId,
              lifestyleCollectionId,
              [Query.equal("employeeId", employee.employeeId)]
            );

            const lifestyleDoc = lifestyleResponse.documents[0];

            return {
              id: employee.$id,
              $id: employee.$id,
              fullName: employee.fullName,
              employeeId: employee.employeeId || "",
              isSmoker: lifestyleDoc?.isSmoker || false,
              isDrinker: lifestyleDoc?.isDrinker || false,
              hasWorkLifeBalance: lifestyleDoc?.hasWorkLifeBalance || "",
              leisureActivities: lifestyleDoc?.leisureActivities || "",
              getsEnoughSleep: lifestyleDoc?.getsEnoughSleep || false,
              sleepDeficiencyReason: lifestyleDoc?.sleepDeficiencyReason || "",
              experiencesStress: lifestyleDoc?.experiencesStress || false,
              stressors: lifestyleDoc?.stressors || "",
              stressManagement: lifestyleDoc?.stressManagement || "",
              year: lifestyleDoc?.year || new Date().getFullYear().toString(),
            };
          })
        );
        break;

      case "workplace":
        const workplaceBaseResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = await Promise.all(
          workplaceBaseResponse.documents.map(async (employee) => {
            const workplaceResponse = await databases.listDocuments(
              databaseId,
              workplaceCollectionId,
              [Query.equal("employeeId", employee.employeeId)]
            );

            const workplaceDoc = workplaceResponse.documents[0];

            // Add detailed debug logging
            console.log("Workplace document raw data:", {
              employeeId: employee.employeeId,
              workplaceDoc: workplaceDoc
                ? JSON.stringify(workplaceDoc)
                : "null",
            });

            return {
              id: employee.$id,
              $id: employee.$id,
              fullName: employee.fullName,
              employeeId: employee.employeeId || "",
              awareSecurityLaws: workplaceDoc?.awareSecurityLaws || false,
              experiencedAbuse: workplaceDoc?.experiencedAbuse || "",
              abuseSource: workplaceDoc?.abuseSource || "",
              abuseAge: workplaceDoc?.abuseAge || "",
              abuseOngoing: workplaceDoc?.abuseOngoing || "",
              abuseReaction: workplaceDoc?.abuseReaction || "",
              willingForCounseling: workplaceDoc?.willingForCounseling || "",
              needsCrisisRoom: workplaceDoc?.needsCrisisRoom || "",
              awareVAWDesk: workplaceDoc?.awareVAWDesk || false,
              hasLegalAssistance: workplaceDoc?.hasLegalAssistance || "",
              awareRA9262Leave: workplaceDoc?.awareRA9262Leave || false,
              year: workplaceDoc?.year || new Date().getFullYear().toString(),
            };
          })
        );
        break;

      case "access":
        const accessBaseResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = await Promise.all(
          accessBaseResponse.documents.map(async (employee) => {
            const accessResponse = await databases.listDocuments(
              databaseId,
              accessCollectionId,
              [Query.equal("employeeId", employee.employeeId)]
            );

            const accessDoc = accessResponse.documents[0];

            return {
              id: employee.$id,
              $id: employee.$id,
              fullName: employee.fullName,
              employeeId: employee.employeeId || "",
              hasOfficeAccess: accessDoc?.hasOfficeAccess || false,
              controlsOfficeResources:
                accessDoc?.controlsOfficeResources || false,
              involvedInDecisions: accessDoc?.involvedInDecisions || false,
              memberOfCommittee: accessDoc?.memberOfCommittee || false,
              consultedOnPolicies: accessDoc?.consultedOnPolicies || "",
              superiorRespectsRights:
                accessDoc?.superiorRespectsRights || false,
              superiorDisrespectReason:
                accessDoc?.superiorDisrespectReason || "",
              treatedWithRespect: accessDoc?.treatedWithRespect || false,
              respectIssueReason: accessDoc?.respectIssueReason || "",
              awareOfGADAuditGuidelines:
                accessDoc?.awareOfGADAuditGuidelines || false,
              auditedGADFunds: accessDoc?.auditedGADFunds || false,
              gadFundsCompliance: accessDoc?.gadFundsCompliance || false,
              year: accessDoc?.year || new Date().getFullYear().toString(),
            };
          })
        );
        break;

      case "physical":
        const physicalBaseResponse = await databases.listDocuments(
          databaseId,
          personalCollectionId,
          includeArchived ? [] : [Query.equal("isArchived", false)]
        );

        employees = await Promise.all(
          physicalBaseResponse.documents.map(async (employee) => {
            const physicalResponse = await databases.listDocuments(
              databaseId,
              physicalCollectionId,
              [Query.equal("employeeId", employee.employeeId)]
            );

            const physicalDoc = physicalResponse.documents[0];

            return {
              id: employee.$id,
              $id: employee.$id,
              fullName: employee.fullName,
              employeeId: employee.employeeId || "",
              hasSportsSkills: physicalDoc?.hasSportsSkills || false,
              sportsSkills: physicalDoc?.sportsSkills || "",
              joinedSCUFAR: physicalDoc?.joinedSCUFAR || false,
              SCUFARNoReason: physicalDoc?.SCUFARNoReason || "",
              hasFitnessProgram: physicalDoc?.hasFitnessProgram || "",
              availsHealthProgram: physicalDoc?.availsHealthProgram || "",
              hasFitnessGuidelines: physicalDoc?.hasFitnessGuidelines || "",
              fitnessProgramManaged:
                physicalDoc?.fitnessProgramManaged || false,
              GADImprovementComments: physicalDoc?.GADImprovementComments || "",
              year: physicalDoc?.year || new Date().getFullYear().toString(),
            };
          })
        );
        break;

      default:
        throw new Error(`Unknown tab name: ${tabName}`);
    }

    return employees;
  } catch (error) {
    throw error;
  }
}

// Function to export all collections and their data
export const exportAllCollections = async () => {
  try {
    // List of all collection IDs
    const collections = [
      userCollectionId,
      eventCollectionId,
      studentCollectionId,
      questionsCollectionId,
      responsesCollectionId,
      formsCollectionId,
      employeesCollectionId,
      employeesSurveyCollectionId,
      notificationsCollectionId,
      activityLogsCollectionId,
      newsCollectionId,
      staffFacultyCollectionId,
      communityCollectionId,
      academicPeriodCollectionId,
      personalCollectionId,
      demographicsCollectionId,
      employmentDetailsCollectionId,
      genderAwarenessCollectionId,
      familyFinancialCollectionId,
      childFamPlanCollectionId,
      healthMedInfoCollectionId,
      lifestyleCollectionId,
      workplaceCollectionId,
      accessCollectionId,
      physicalCollectionId,
    ];

    const exportData = {};

    // Fetch all documents from each collection
    for (const collectionId of collections) {
      if (!collectionId) continue; // Skip if collection ID is not defined

      try {
        const response = await databases.listDocuments(
          databaseId,
          collectionId,
          [Query.limit(1000)] // Adjust limit as needed
        );

        exportData[collectionId] = {
          documents: response.documents,
          total: response.total,
        };

        console.log(
          `Exported ${response.total} documents from collection ${collectionId}`
        );
      } catch (error) {
        console.error(`Error exporting collection ${collectionId}:`, error);
        exportData[collectionId] = {
          error: error.message,
          documents: [],
        };
      }
    }

    return exportData;
  } catch (error) {
    throw new Error(`Failed to export collections: ${error.message}`);
  }
};

// Function to import all collections and their data
export const importAllCollections = async (exportData) => {
  try {
    const importResults = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Import each collection's data
    for (const [collectionId, data] of Object.entries(exportData)) {
      if (!data.documents || !Array.isArray(data.documents)) continue;

      console.log(
        `Importing ${data.documents.length} documents to collection ${collectionId}`
      );

      for (const document of data.documents) {
        try {
          // Remove Appwrite-specific fields
          const {
            $id,
            $createdAt,
            $updatedAt,
            $permissions,
            ...cleanDocument
          } = document;

          // Create new document in the target database
          await databases.createDocument(
            databaseId,
            collectionId,
            ID.unique(),
            cleanDocument
          );

          importResults.successful++;
        } catch (error) {
          importResults.failed++;
          importResults.errors.push({
            collectionId,
            documentId: document.$id,
            error: error.message,
          });
          console.error(
            `Error importing document ${document.$id} to collection ${collectionId}:`,
            error
          );
        }
      }
    }

    return importResults;
  } catch (error) {
    throw new Error(`Failed to import collections: ${error.message}`);
  }
};

// Function to migrate all data between databases
export const migrateAllData = async () => {
  try {
    console.log("Starting data migration...");

    // Export all data
    const exportData = await exportAllCollections();
    console.log("Export completed:", exportData);

    // Import all data
    const importResults = await importAllCollections(exportData);
    console.log("Import completed:", importResults);

    return {
      exportData,
      importResults,
    };
  } catch (error) {
    throw new Error(`Migration failed: ${error.message}`);
  }
};

export const fetchUserCounts = async () => {
  try {
    console.log("Fetching user counts...");
    const limit = 100; // Process 100 users at a time
    let offset = 0;
    let allUsers = [];
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userCollectionId,
          [Query.limit(limit), Query.offset(offset)]
        );

        if (response.documents.length === 0) {
          hasMore = false;
        } else {
          allUsers = [...allUsers, ...response.documents];
          offset += limit;

          // Add a small delay to prevent rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error fetching users batch at offset ${offset}:`, error);
        // If we hit a rate limit, wait longer and retry
        if (error.code === 429) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        throw error;
      }
    }

    console.log("Processing user counts for", allUsers.length, "users");
    const counts = {
      totalUsers: allUsers.length,
      pendingUsers: allUsers.filter(
        (user) => user?.approvalStatus === "pending"
      ).length,
      approvedUsers: allUsers.filter(
        (user) => user?.approvalStatus === "approved"
      ).length,
      activeUsers: allUsers.filter((user) => user?.status === "active").length,
      inactiveUsers: allUsers.filter((user) => user?.status === "inactive")
        .length,
      verifiedUsers: allUsers.filter((user) => user?.isVerified === true)
        .length,
      unverifiedUsers: allUsers.filter((user) => user?.isVerified !== true)
        .length,
    };

    console.log("User counts:", counts);
    return counts;
  } catch (error) {
    console.error("Error fetching user counts:", error);
    // Return default counts instead of throwing
    return {
      totalUsers: 0,
      pendingUsers: 0,
      approvedUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      verifiedUsers: 0,
      unverifiedUsers: 0,
    };
  }
};

// Login function
export async function login(email, password) {
  try {
    console.log("Starting login process for:", email);

    // Delete any existing session
    try {
      await account.deleteSession("current");
      console.log("Cleaned up existing session");
    } catch (error) {
      console.log("No existing session to clean up");
    }

    // Create new session
    console.log("Creating new session...");
    const session = await account.createEmailPasswordSession(email, password);
    console.log("Session created successfully");

    // Get account details
    console.log("Getting account details...");
    const accountDetails = await account.get();
    console.log("Account details retrieved successfully");

    // Get user document from database
    console.log("Getting user document from database...");
    const userDocuments = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.equal("accountId", accountDetails.$id)]
    );

    if (!userDocuments || userDocuments.total === 0) {
      throw new Error("User document not found");
    }

    console.log("Found user document:", userDocuments.documents[0]);
    return true;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Helper to check if a session exists (returns true/false)
export const hasValidSession = async () => {
  try {
    const accountData = await account.get();
    return !!accountData;
  } catch (error) {
    if (
      error.code === 401 ||
      (error.message && error.message.includes("unauthorized"))
    ) {
      return false;
    }
    throw error;
  }
};
