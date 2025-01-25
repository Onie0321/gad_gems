import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Realtime,
  Storage,
  Permission,
  Role,
  Teams,
  RealtimeResponseEvent,
} from "appwrite";

export const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("670e7a740019d9d38739");

export const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
export const userCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID;
export const eventCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID;
export const participantCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_PARTICIPANT_COLLECTION_ID;
export const studentsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
export const questionsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID;
export const responsesCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID;
export const formsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_FORMS_COLLECTION_ID;
export const formsBucketId = process.env.NEXT_PUBLIC_APPWRITE_FORMS_BUCKET_ID;
export const employeesCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_COLLECTION_ID;
export const employeesSurveyCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEESURVEY_COLLECTION_ID;
export const notificationsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID;
export const activityLogsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_ACTIVITYLOGS_COLLECTION_ID;
export const newsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_NEWS_COLLECTION_ID;
export const staffFacultyCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_STAFFFACULTY_COLLECTION_ID;
export const communityCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_COMMUNITY_COLLECTION_ID;
export const academicPeriodCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_ACADEMIC_PERIOD_COLLECTION_ID;

export const account = new Account(client);
//const avatars = new Avatars(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

export async function createGoogleUser(userId, email, name) {
  try {
    // Create the user document in the database
    const newUser = await databases.createDocument(
      databaseId,
      userCollectionId,
      userId,
      {
        email: email,
        name: name,
        role: "user", // Default role for Google sign-ins
      }
    );

    return newUser;
  } catch (error) {
    console.error("Error creating Google user:", error.message);
    throw new Error("Error creating Google user");
  }
}
// src/lib/appwrite.js

// ... other imports and configurations ...

export const updateUserFirstLogin = async (userId) => {
  try {
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
      userId,
      {
        isFirstLogin: false,
      }
    );
  } catch (error) {
    console.error("Error updating user first login status:", error);
  }
};

export const subscribe = (collectionId, callback) => {
  const unsubscribe = client.subscribe(
    `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${collectionId}.documents`,
    (response) => {
      callback(response.payload);
    }
  );

  return unsubscribe;
};

export async function createUser(email, password, name, role = "user") {
  try {
    // Create the new account
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw new Error("Account creation failed.");

    // Create the user document with more specific fields
    const newUser = await databases.createDocument(
      databaseId,
      userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        name: name,
        role: role,
        approvalStatus: "pending", // Set initial status as pending
      }
    );

    // Log the registration activity
    await logActivity(newUser.$id, "User Registered: " + name);

    // Create notifications
    await createNotification({
      userId: "admin",
      type: "account",
      title: "New User Registration",
      message: `New user ${name} has registered and requires approval.`,
      actionType: "user_registration",
      status: "pending",
    });

    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === 400) {
      throw new Error("Email already exists or invalid password format");
    }
    throw new Error(error.message || "Failed to create user");
  }
}

export async function getAllUsers(email) {
  try {
    const response = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.equal("email", email)]
    );
    return response.documents.length > 0;
  } catch (error) {
    console.error("Error checking existing users:", error);
    throw error;
  }
}

export const checkAndRefreshSession = async () => {
  try {
    // Try to get the current session
    await account.get();
    return true; // Session is valid
  } catch (error) {
    if (error.code === 401) {
      try {
        // Try to refresh the session
        await account.createAnonymousSession();
        return true; // Session refreshed successfully
      } catch (refreshError) {
        console.error("Failed to refresh session:", refreshError);
        return false; // Unable to refresh session
      }
    }
    console.error("Error checking session:", error);
    return false; // Other error occurred
  }
};

export async function getAccount() {
  try {
    console.log("Fetching current account...");
    const currentAccount = await account.get();
    return currentAccount;
  } catch (error) {
    if (
      error.message.includes("Missing scope") ||
      error.message.includes("unauthorized")
    ) {
      console.warn(
        "User is not authenticated. Redirect to login or handle session."
      );
      // Redirect to login page or handle session
      return null;
    } else {
      throw new Error(error.message || "Error fetching account");
    }
  }
}

export async function getCurrentUser() {
  try {
    // Ensure the user is authenticated before fetching account info
    const currentAccount = await getAccount();

    if (!currentAccount || !currentAccount.$id) {
      throw new Error("No account found.");
    }

    // Query for the user document using the accountId
    const currentUserResponse = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.equal("accountId", currentAccount.$id)] // Ensure 'accountId' is the correct field name
    );

    console.log("Current user response:", currentUserResponse); // Add this log

    if (
      !currentUserResponse ||
      !Array.isArray(currentUserResponse.documents) ||
      currentUserResponse.total === 0
    ) {
      throw new Error("No user document found.");
    }

    const userDocument = currentUserResponse.documents[0]; // Get the user document

    // Check if the role field exists in the document
    if (!userDocument.role) {
      // If the role field is missing, assign a default role (e.g., 'user')
      userDocument.role = "user";
    }

    console.log("Fetched User Document:", userDocument); // Log the fetched user document
    return userDocument; // Return the user document which includes role
  } catch (error) {
    return null; // Return null if there's an error
  }
}

export async function getUserRole(userId) {
  try {
    const user = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
      userId
    );
    return user.role;
  } catch (error) {
    console.error("Error fetching user role:", error);
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
    return response;
  } catch (error) {
    throw new Error(error.message || "Failed to update user.");
  }
}

// Function to delete a user
export async function deleteUser(userId) {
  try {
    await databases.deleteDocument(databaseId, userCollectionId, userId.$id);
  } catch (error) {
    throw new Error(error.message || "Failed to delete user.");
  }
}

// Sign In
export async function SignIn(email, password) {
  try {
    // Delete any existing session first
    try {
      await account.deleteSession("current");
    } catch (error) {
      // Ignore error if no session exists
    }

    // Create new email session
    const session = await account.createEmailPasswordSession(email, password);

    if (!session) {
      throw new Error("Failed to create session");
    }

    // Get the account details
    const accountDetails = await account.get();

    if (!accountDetails) {
      throw new Error("Failed to get account details");
    }

    return accountDetails;
  } catch (error) {
    console.error("SignIn error:", error);
    if (error.code === 401) {
      throw new Error("Invalid email or password");
    }
    throw new Error(error.message || "Error signing in");
  }
}

export const createEmailSession = async (email, password) => {
  try {
    await account.createSession(email, password);
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    console.error("Error creating email session:", error);
    throw error;
  }
};

export async function getAllSessions() {
  try {
    const sessions = await account.listSessions();
    console.log("All active sessions:", sessions);
    return sessions;
  } catch (error) {
    console.error("Error fetching all sessions:", error.message);
    return { sessions: [] };
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    console.error("Error signing out:", error.message);
    throw new Error(error);
  }
}

export async function deleteSession(sessionId) {
  try {
    await account.deleteSession(sessionId);
    console.log(`Session with ID ${sessionId} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting session:", error.message);
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
    console.log("All sessions deleted successfully");
  } catch (error) {
    console.error("Error deleting sessions:", error);
    throw new Error("Failed to delete existing sessions");
  }
}

export const checkUserSession = async () => {
  try {
    const user = await account.get();
    console.log("Current User:", user);
    return user;
  } catch (error) {
    console.error("User session not found:", error.message);
    toast.error("Please log in to perform this action.");
    return null;
  }
};

export async function setAdminApproval(userId, approved) {
  try {
    await account.updatePrefs({ adminApproved: approved });
    return true;
  } catch (error) {
    console.error("Error setting admin approval:", error);
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
    console.error("Error creating event:", error);
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
    console.error("Error fetching events:", error);
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
      participantCollectionId,
      query
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching participants:", error);
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
    console.error("Error fetching event:", error);
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
    console.error("Error checking for duplicate event:", error);
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
    console.error("Error editing event:", error);
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
    console.error("Error deleting event:", error);
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
    console.error("Error checking time conflict:", error);
    throw error;
  }
};

export const createParticipant = async (participantData, createdById) => {
  try {
    const response = await databases.createDocument(
      databaseId,
      participantCollectionId,
      ID.unique(),
      {
        ...participantData,
        createdBy: createdById,
      }
    );
    console.log("Participant created successfully:", response);
    return response;
  } catch (error) {
    console.error("Error creating participant:", error);
    // Instead of throwing an error, we'll return null
    return null;
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
      participantCollectionId
    );

    return {
      events: eventsResponse.documents,
      participants: participantsResponse.documents,
    };
  } catch (error) {
    console.error("Error fetching events and participants:", error);
    throw error;
  }
}

export const updateParticipant = async (participantId, updatedData) => {
  try {
    const response = await databases.updateDocument(
      databaseId,
      participantCollectionId,
      participantId,
      updatedData
    );
    return response;
  } catch (error) {
    console.error("Error updating participant:", error);
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
    console.error("Error updating event participants:", error);
    throw error;
  }
};

export const updateEvent = async (eventId, updateData) => {
  try {
    const updatedEvent = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID,
      eventId,
      updateData
    );
    return updatedEvent;
  } catch (error) {
    console.error("Error updating event:", error);
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
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_PARTICIPANT_COLLECTION_ID,
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
    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_PARTICIPANT_COLLECTION_ID,
      participantId
    );

    return true;
  } catch (error) {
    console.error("Error in deleteParticipant:", error);
    throw error;
  }
};

export async function getParticipantByStudentId(studentId) {
  try {
    const response = await databases.listDocuments(
      databaseId,
      participantCollectionId,
      [Query.equal("studentId", studentId)]
    );

    if (response.documents.length > 0) {
      return response.documents[0]; // Return the first matching document
    } else {
      return null; // Return null if no participant is found
    }
  } catch (error) {
    console.error("Error fetching participant by studentId:", error);
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
    // For students, we only need to check the participantCollectionId
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
      participantCollectionId,
      query,
    });

    const response = await databases.listDocuments(
      databaseId,
      participantCollectionId, // Always use participantCollectionId for all types
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
export async function checkDuplicateParticipant(
  eventId,
  studentId = "",
  name = ""
) {
  console.log("Checking for duplicate participant:", {
    eventId,
    studentId,
    name,
  });

  try {
    const queries = [Query.equal("eventId", eventId)];

    if (studentId) {
      queries.push(Query.equal("studentId", studentId));
    }
    if (name) {
      queries.push(Query.equal("name", name));
    }

    const response = await databases.listDocuments(
      databaseId,
      participantCollectionId,
      queries
    );

    console.log("Duplicate check response:", response);
    return response.total > 0;
  } catch (error) {
    console.error("Error checking for duplicate participant:", error);
    throw error;
  }
}

export function subscribeToRealTimeUpdates(collectionId, callback) {
  if (!databaseId || !collectionId) {
    console.error("Missing databaseId or collectionId for subscription.");
    return () => {}; // Return a no-op function if invalid
  }

  const unsubscribe = client.subscribe(
    `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${collectionId}.documents`,
    (response) => {
      console.log("Real-time update received:", response);
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
    console.error("Error changing password:", error);
    throw error;
  }
}

export async function uploadAvatar(file) {
  try {
    const response = await storage.createFile("avatars", ID.unique(), file);
    return storage.getFileView("avatars", response.$id);
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
}

export async function deleteAvatar(fileId) {
  try {
    await storage.deleteFile("avatars", fileId);
  } catch (error) {
    console.error("Error deleting avatar:", error);
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
        databases.listDocuments(databaseId, participantCollectionId, [
          Query.equal("eventId", event.$id),
        ])
      )
    );

    return {
      events: events.documents,
      participants: participants.flatMap((p) => p.documents),
    };
  } catch (error) {
    console.error("Error fetching trend data:", error);
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
    "Below 18": { male: 0, female: 0 },
    "18-24": { male: 0, female: 0 },
    "25-34": { male: 0, female: 0 },
    "35-44": { male: 0, female: 0 },
    "45-54": { male: 0, female: 0 },
    "Above 55": { male: 0, female: 0 },
  };

  participants.forEach((p) => {
    const age = parseInt(p.age);
    const sex = p.sex.toLowerCase();
    if (age < 18) ageGroups["Below 18"][sex]++;
    else if (age >= 18 && age <= 24) ageGroups["18-24"][sex]++;
    else if (age >= 25 && age <= 34) ageGroups["25-34"][sex]++;
    else if (age >= 35 && age <= 44) ageGroups["35-44"][sex]++;
    else if (age >= 45 && age <= 54) ageGroups["45-54"][sex]++;
    else if (age >= 55) ageGroups["Above 55"][sex]++;
  });

  return Object.entries(ageGroups).map(([name, value]) => ({
    name,
    male: value.male,
    female: value.female,
    total: value.male + value.female,
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
      participantCollectionId
    );

    return {
      events: events.documents,
      participants: participants.documents,
    };
  } catch (error) {
    console.error("Error fetching report data:", error);
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
      studentsCollectionId,
      ID.unique(),
      studentData
    );
    return response;
  } catch (error) {
    console.error("Error creating student:", error);
    throw error;
  }
};

export const getStudents = async (page = 1, limit = 10) => {
  try {
    const response = await databases.listDocuments(
      databaseId,
      studentsCollectionId,
      [Query.limit(limit), Query.offset((page - 1) * limit)]
    );
    return response;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

export const updateStudent = async (studentId, updatedData) => {
  try {
    const response = await databases.updateDocument(
      databaseId,
      studentsCollectionId,
      studentId,
      updatedData
    );
    return response;
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};

export const deleteStudent = async (studentId) => {
  try {
    await databases.deleteDocument(databaseId, studentsCollectionId, studentId);
  } catch (error) {
    console.error("Error deleting student:", error);
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
    console.error("Error fetching questions:", error);
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
    console.error("Error creating response:", error);
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
    console.error("Error saving response:", error);
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

    console.log("Raw response from Appwrite:", response);

    if (response && response.documents) {
      return response.documents;
    } else {
      console.error("Unexpected response structure:", response);
      return [];
    }
  } catch (error) {
    console.error("Error listing responses:", error);
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
    console.error("Error updating response:", error);
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
    console.error("Error deleting response:", error);
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
    console.error("Error processing employee data:", error);
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
    console.error("Error fetching imported files:", error);
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
    console.error("Error creating form document:", error);
    throw error;
  }
}

export async function getAllEmployeeData() {
  try {
    const employees = await databases.listDocuments(
      databaseId,
      employeesCollectionId
    );
    const surveys = await databases.listDocuments(
      databaseId,
      employeesSurveyCollectionId
    );

    return employees.documents.map((employee) => {
      const survey = surveys.documents.find(
        (s) => s.employeeDataId === employee.$id
      );
      return {
        ...employee,
        surveyData: survey || { questionsAnswers: [] },
      };
    });
  } catch (error) {
    console.error("Error fetching employee data:", error);
    throw error;
  }
}

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
    console.error("Error fetching employee data:", error);
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
  approvalStatus = "pending",
  status = "pending",
  read = false,
}) => {
  try {
    const response = await databases.createDocument(
      databaseId,
      notificationsCollectionId,
      ID.unique(),
      {
        userId,
        type,
        title,
        message,
        actionType,
        approvalStatus,
        status,
        read,
        timestamp: new Date().toISOString(),
      }
    );
    return response;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
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
    console.error("Error marking notification as read:", error);
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
    console.error("Error fetching notifications:", error);
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

export async function fetchNotifications(filters = []) {
  try {
    const response = await databases.listDocuments(
      databaseId,
      notificationsCollectionId, // Ensure this matches your notification collection ID
      filters
    );
    return response.documents; // Return the documents array containing the notifications
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

// Add these helper functions for dashboard calculations
const calculateSexDistribution = (participants) => {
  const maleCount = participants.filter((p) => p.sex === "Male").length;
  const femaleCount = participants.filter((p) => p.sex === "Female").length;

  return [
    { name: "Male", value: maleCount },
    { name: "Female", value: femaleCount },
  ];
};

const calculateAgeDistribution = (participants) => {
  const ageGroups = {
    "Under 18": 0,
    "18-24": 0,
    "25-34": 0,
    "35-44": 0,
    "45+": 0,
  };

  participants.forEach((participant) => {
    const age = participant.age;
    if (age < 18) ageGroups["Under 18"]++;
    else if (age <= 24) ageGroups["18-24"]++;
    else if (age <= 34) ageGroups["25-34"]++;
    else if (age <= 44) ageGroups["35-44"]++;
    else ageGroups["45+"]++;
  });

  return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
};

const calculateLocationDistribution = (participants) => {
  // Calculate location distribution with proper formatting
  const locations = {};

  participants.forEach((participant) => {
    const location = participant.homeAddress || "Not Specified";
    // Clean up the location string and capitalize first letter of each word
    const formattedLocation = location
      .split(",")[0] // Take only the first part before comma if exists
      .trim()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    locations[formattedLocation] = (locations[formattedLocation] || 0) + 1;
  });

  // Convert to array format and sort by count
  return Object.entries(locations)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value) // Sort by count in descending order
    .slice(0, 10); // Only take top 10 locations
};

export const fetchTotals = async (academicPeriodId) => {
  try {
    // Fetch events
    const eventsResponse = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal("academicPeriodId", academicPeriodId),
        Query.equal("isArchived", false),
        Query.orderDesc("createdAt"),
      ]
    );

    const events = eventsResponse.documents;
    const eventIds = events.map((event) => event.$id);

    // Fetch participants only if there are events
    let participants = [];
    if (eventIds.length > 0) {
      const participantsResponse = await databases.listDocuments(
        databaseId,
        participantCollectionId,
        [Query.equal("eventId", eventIds), Query.equal("isArchived", false)]
      );
      participants = participantsResponse.documents;
    }

    // Calculate totals
    const totalEvents = events.length;
    const academicEvents = events.filter(
      (event) => event.eventType === "Academic"
    ).length;
    const nonAcademicEvents = events.filter(
      (event) => event.eventType === "Non-Academic"
    ).length;
    const totalParticipants = participants.length;

    // Calculate distributions
    const sexDistribution = calculateSexDistribution(participants);
    const ageDistribution = calculateAgeDistribution(participants);
    const locationDistribution = calculateLocationDistribution(participants);

    return {
      totalEvents,
      academicEvents,
      nonAcademicEvents,
      totalParticipants,
      sexDistribution,
      ageDistribution,
      locationDistribution,
    };
  } catch (error) {
    console.error("Error fetching totals:", error);
    throw error;
  }
};

export const logActivity = async (userId, activityType) => {
  try {
    const response = await databases.createDocument(
      databaseId,
      activityLogsCollectionId,
      "unique()",
      {
        userId,
        activityType,
        timestamp: new Date().toISOString(),
      }
    );
    return response;
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
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
      activityLogsCollectionId, // make sure this matches your collection ID
      ID.unique(),
      {
        userId,
        activityType: `${userRole} Sign Out`,
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error("Error logging sign out activity:", error);
  }
};

export const updateUserStatus = async (userId, newStatus) => {
  try {
    if (!databaseId || !userCollectionId) {
      throw new Error("Database or Collection ID not configured");
    }

    const response = await databases.updateDocument(
      databaseId,
      userCollectionId,
      userId,
      {
        approvalStatus: newStatus,
      }
    );

    return response;
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    console.log("Fetching users with:", {
      databaseId,
      userCollectionId,
    });

    if (!databaseId || !userCollectionId) {
      throw new Error("Database or Collection ID not configured");
    }

    const response = await databases.listDocuments(
      databaseId,
      userCollectionId
    );

    console.log("Fetched users response:", response);
    return response.documents;
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });
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
    console.error("Error fetching activity logs:", error);
    throw error;
  }
}

export const checkConnection = async () => {
  try {
    await client.health.get();
    console.log("Appwrite connection successful");
    return true;
  } catch (error) {
    console.error("Appwrite connection failed:", error);
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
            participantCollectionId,
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
          console.error(
            `Error fetching participants for event ${event.$id}:`,
            error
          );
          return {
            ...event,
            participants: [],
          };
        }
      })
    );

    return eventsWithParticipants;
  } catch (error) {
    console.error("Error listing events:", error);
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
    console.error("Error updating event visibility:", error);
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

export const createAcademicPeriod = async (
  startDate,
  endDate,
  schoolYear,
  periodType
) => {
  try {
    return await databases.createDocument(
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
      }
    );
  } catch (error) {
    console.error("Error creating academic period:", error);
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
    console.error("Error archiving period:", error);
    throw error;
  }
};

export const getCurrentAcademicPeriod = async () => {
  try {
    // First, validate that we have the required IDs
    if (!databaseId || !academicPeriodCollectionId) {
      console.error("Configuration error: Missing database or collection ID");
      throw new Error("Database or Collection ID not configured");
    }

    console.log("Fetching academic period with:", {
      databaseId,
      academicPeriodCollectionId,
    });

    // Query for active academic period
    const response = await databases.listDocuments(
      databaseId,
      academicPeriodCollectionId,
      [
        Query.equal("isActive", true),
        Query.orderDesc("createdAt"),
        Query.limit(1),
      ]
    );

    console.log("Academic period response:", response);

    // Validate response
    if (!response || !response.documents || response.documents.length === 0) {
      console.warn("No active academic period found in database");
      return null;
    }

    const currentPeriod = response.documents[0];
    console.log("Found current period:", currentPeriod);

    // Validate the period dates
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

    // Check if we're within the period dates
    if (now < startDate) {
      console.log("Current date is before the period start date");
      return currentPeriod; // Still return the period as it's the upcoming active period
    }

    if (now > endDate) {
      console.warn("Current academic period has expired");
      // Auto-archive expired period
      try {
        await databases.updateDocument(
          databaseId,
          academicPeriodCollectionId,
          currentPeriod.$id,
          {
            isActive: false,
            archivedAt: new Date().toISOString(),
          }
        );
        console.log("Successfully archived expired period");
      } catch (archiveError) {
        console.error("Failed to archive expired period:", archiveError);
      }
      return null;
    }

    // Period is valid and active
    console.log("Returning valid academic period");
    return currentPeriod;
  } catch (error) {
    console.error("Error getting current academic period:", error);
    throw new Error("Failed to retrieve academic period: " + error.message);
  }
};

// Function to archive current data when creating new academic period
export const archiveCurrentPeriodData = async (oldPeriodId, newPeriodId) => {
  try {
    // Archive events and participants
    const [eventsResponse, participantsResponse] = await Promise.all([
      databases.listDocuments(databaseId, eventCollectionId),
      databases.listDocuments(databaseId, participantCollectionId),
    ]);

    // Update all events to be archived
    const eventUpdates = eventsResponse.documents.map((event) =>
      databases.updateDocument(databaseId, eventCollectionId, event.$id, {
        isArchived: true,
        academicPeriodId: oldPeriodId,
        archivedAt: new Date().toISOString(),
      })
    );

    // Update all participants to be archived
    const participantUpdates = participantsResponse.documents.map(
      (participant) =>
        databases.updateDocument(
          databaseId,
          participantCollectionId,
          participant.$id,
          {
            isArchived: true,
            academicPeriodId: oldPeriodId,
            archivedAt: new Date().toISOString(),
          }
        )
    );

    // Wait for all updates to complete
    await Promise.all([...eventUpdates, ...participantUpdates]);

    return true;
  } catch (error) {
    console.error("Error archiving period data:", error);
    throw new Error("Failed to archive current data");
  }
};

// Function to validate academic period data
export const validateAcademicPeriod = (
  schoolYear,
  periodType,
  startDate,
  endDate
) => {
  const errors = [];

  if (!schoolYear) {
    errors.push("School year is required");
  }

  if (!periodType) {
    errors.push("Period type is required");
  }

  if (!startDate) {
    errors.push("Start date is required");
  }

  if (!endDate) {
    errors.push("End date is required");
  }

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    errors.push("Start date must be before end date");
  }

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
    // First archive the current period if it exists
    if (currentPeriodId) {
      await archiveCurrentPeriod(currentPeriodId);
    }

    // Create new period
    const newPeriod = await createAcademicPeriod(
      startDate,
      endDate,
      schoolYear,
      periodType
    );

    // Archive current data
    await archiveCurrentPeriodData(currentPeriodId, newPeriod.$id);

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
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const fetchEventParticipants = async (eventIds, academicPeriodId) => {
  try {
    const participantsResponse = await databases.listDocuments(
      databaseId,
      participantCollectionId,
      [
        Query.equal("isArchived", false),
        Query.equal("academicPeriodId", academicPeriodId),
        Query.equal("eventId", eventIds),
      ]
    );

    return participantsResponse.documents;
  } catch (error) {
    console.error("Error fetching participants:", error);
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

    // Fetch participants
    const participantsResponse = await databases.listDocuments(
      databaseId,
      participantCollectionId,
      [
        Query.equal("academicPeriodId", currentPeriod.$id),
        Query.equal("eventId", eventIds),
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
    console.error("Error fetching event overview data:", error);
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
      ]
    );

    const participantsResponse = await databases.listDocuments(
      databaseId,
      participantCollectionId,
      [
        Query.equal("isArchived", false),
        Query.equal("academicPeriodId", currentPeriod.$id),
        Query.equal(
          "eventId",
          eventsResponse.documents.map((event) => event.$id)
        ),
      ]
    );

    return {
      events: eventsResponse.documents,
      participants: participantsResponse.documents,
      currentPeriod,
    };
  } catch (error) {
    console.error("Error fetching log data:", error);
    throw error;
  }
};

// Add these new functions to handle event participant log operations

export const fetchEventParticipantLogData = async (userId) => {
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
        staffFaculty: [],
        community: [],
        currentPeriod,
      };
    }

    const eventIds = eventsResponse.documents.map((event) => event.$id);

    // Fetch all participant types
    const [participantsResponse, staffFacultyResponse, communityResponse] =
      await Promise.all([
        databases.listDocuments(databaseId, participantCollectionId, [
          Query.equal("eventId", eventIds),
        ]),
        databases.listDocuments(databaseId, staffFacultyCollectionId, [
          Query.equal("eventId", eventIds),
        ]),
        databases.listDocuments(databaseId, communityCollectionId, [
          Query.equal("eventId", eventIds),
        ]),
      ]);

    return {
      events: eventsResponse.documents,
      participants: participantsResponse.documents,
      staffFaculty: staffFacultyResponse.documents,
      community: communityResponse.documents,
      currentPeriod,
    };
  } catch (error) {
    console.error("Error fetching event participant log data:", error);
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
    staff: staffParticipants.length,
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
    console.error("Error fetching staff/faculty:", error);
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
    console.error("Error fetching community members:", error);
    throw error;
  }
};
