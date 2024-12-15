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

export async function createUser(email, password, name, role = "user") {
  try {
    // Create the new account
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw new Error("Account creation failed.");

    // Create the user document in the database with the role field
    const newUser = await databases.createDocument(
      databaseId,
      userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        name: name,
        role: role, // Set role to 'admin' or 'user' as needed
        approvalStatus: "approved",
      }
    );

    // Sign in the new user
  } catch (error) {
    // Check if the error is related to password strength
    if (
      error.message.includes(
        "Password must be between 8 and 265 characters long"
      )
    ) {
      throw new Error(
        "Password must be at least 8 characters long and should not be a commonly used password. Please choose a more secure password."
      );
    }

    // Catch any other errors
    console.error("Error creating user:", error.message);
    throw new Error("Error creating user");
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
    // Check for existing session and delete it if it exists
    try {
      const currentSession = await account.getSession("current");
      if (currentSession) {
        await account.deleteSession("current");
      }
    } catch (sessionError) {
      // If there's no active session, this error is expected, so we can ignore it
      console.log("No active session found, proceeding with login.");
    }

    // Create a new email session
    const session = await account.createEmailPasswordSession(email, password);
    if (session) {
      // Ensure the user has the account scope
      const currentAccount = await account.get();
      if (!currentAccount) throw new Error("Unable to retrieve account.");
      return currentAccount; // Return the account if successful
    } else {
      throw new Error("Failed to create session.");
    }
  } catch (error) {
    console.error("Error signing in:", error.message);
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

export const createEvent = async (eventData, userId) => {
  try {
    const response = await databases.createDocument(
      databaseId,
      eventCollectionId,
      ID.unique(),
      {
        eventName: eventData.eventName,
        eventDate: eventData.eventDate,
        eventTimeFrom: eventData.eventTimeFrom,
        eventTimeTo: eventData.eventTimeTo,
        eventVenue: eventData.eventVenue,
        eventType: eventData.eventType,
        eventCategory: eventData.eventCategory,
        numberOfHours: eventData.numberOfHours,
        approvalStatus: "pending",
        createdBy: userId,
      }
    );

    console.log("Event created successfully:", response);
    return response;
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Failed to create event. Please try again.");
  }
};

export const getEvents = async (userId) => {
  try {
    if (!userId) {
      console.error("UserId is missing or invalid");
      return [];
    }

    const response = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [Query.equal("createdBy", userId)]
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching events:", error);
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
    // Perform the update on the specified event using its ID
    const response = await databases.updateDocument(
      databaseId, // Database ID
      eventCollectionId, // Collection ID
      eventId, // Document ID to update
      eventData // Updated data
    );
    return response; // Return the updated event
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
    // Convert eventTimeFrom and eventTimeTo to ISO 860s
    const eventTimeFromISO = new Date(
      `${eventDate}T${eventTimeFrom}:00`
    ).toISOString();
    const eventTimeToISO = new Date(
      `${eventDate}T${eventTimeTo}:00`
    ).toISOString();

    const response = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal("eventDate", eventDate),
        Query.equal("eventVenue", eventVenue),
        Query.lessThan("eventTimeTo", eventTimeFromISO),
        Query.greaterThan("eventTimeFrom", eventTimeToISO),
      ]
    );

    return response.total > 0;
  } catch (error) {
    console.error("Error checking for time conflict:", error);
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

export const getParticipants = async (eventId, createdById) => {
  try {
    // Ensure eventId is defined
    if (!eventId) {
      throw new Error("eventId is missing.");
    }

    const response = await databases.listDocuments(
      databaseId,
      participantCollectionId,
      [Query.equal("eventId", eventId), Query.equal("createdBy", createdById)]
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching participants:", error);
    throw error;
  }
};

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

export const deleteParticipant = async (participantId) => {
  try {
    await databases.deleteDocument(
      databaseId,
      participantCollectionId,
      participantId
    );
  } catch (error) {
    console.error("Error deleting participant:", error);
    throw error;
  }
};

export async function checkDuplicateParticipant(eventId, studentId, name) {
  if (!eventId || (!studentId && !name)) {
    console.error("Invalid input: eventId, studentId, or name is missing");
    return false;
  }

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

    return response.total > 0;
  } catch (error) {
    console.error("Error checking for duplicate participant:", error);
    throw error;
  }
}

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

export async function fetchParticipantData(value, currentEventId) {
  if (!value || !currentEventId) {
    console.error("Invalid input: value or currentEventId is missing");
    return null;
  }

  try {
    const response = await databases.listDocuments(
      databaseId,
      participantCollectionId,
      [
        Query.or([Query.equal("studentId", value), Query.equal("name", value)]),
        Query.notEqual("eventId", currentEventId),
      ]
    );

    if (response.documents.length > 0) {
      const participant = response.documents[0];
      console.log("Participant found:", participant);
      return {
        studentId: participant.studentId,
        name: participant.name,
        sex: participant.sex,
        age: participant.age,
        school: participant.school,
        year: participant.year,
        section: participant.section,
        ethnicGroup: participant.ethnicGroup,
        otherEthnicGroup: participant.otherEthnicGroup,
      };
    }
    console.log("No matching participant found for value:", value);
    return null;
  } catch (error) {
    console.error("Error fetching participant data:", error);
    return null;
  }
}

export function subscribeToRealTimeUpdates(collectionId, callback) {
  if (!databaseId || !collectionId) {
    console.error("Missing databaseId or collectionId for subscription.");
    return () => {}; // Return a no-op function if invalid
  }

  const unsubscribe = client.subscribe(
    `databases.${databaseId}.collections.${collectionId}.documents`,
    (response) => {
      console.log("Real-time update received:", response);
      if (response.events.includes("databases.*.collections.*.documents.*")) {
        callback();
      }
    }
  );

  return unsubscribe; // Return the unsubscribe function for cleanup
}

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

export async function createNotification(notificationData) {
  try {
    const response = await databases.createDocument(
      databaseId,
      notificationsCollectionId, // Make sure this collection exists in your Appwrite database
      ID.unique(),
      notificationData
    );
    return response;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

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
