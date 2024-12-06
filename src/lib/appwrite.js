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
    } from "appwrite";

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

  export const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const userCollectionId = process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID;
    export const eventCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID;
    export const participantCollectionId =
      process.env.NEXT_PUBLIC_APPWRITE_PARTICIPANT_COLLECTION_ID;
      export const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;

    const account = new Account(client);
    //const avatars = new Avatars(client);
    export const databases = new Databases(client);
    export const storage = new Storage(client);

    export async function createUser(email, password, name, role = "user") {
      try {
        // Create the new account
        const newAccount = await account.create(ID.unique(), email, password, name);
        if (!newAccount) throw new Error("Account creation failed.");

        // Generate an avatar URL for the user
        //  const avatarUrl = avatars.getInitials(username);

        // Create the user document in the database with the role field
        const newUser = await databases.createDocument(
          databaseId,
          userCollectionId,
          ID.unique(),
          {
            accountId: newAccount.$id,
            email: email,
            name: name,
            // avatar: avatarUrl,
            role: role, // Set role to 'admin' or 'user' as needed
          }
        );

        // Sign in the new user
        const session = await account.createEmailPasswordSession(email, password);
        if (session) {
          // Return the newUser object with the role property
          return newUser; // Return the user object if successful
        } else {
          throw new Error("Failed to create session.");
        }
      } catch (error) {
        console.error("Error creating user:", error.message);
        throw new Error("Error creating user");
      }
    }

    export async function updateUser(userId, updatedData) {
      try {
        const response = await databases.updateDocument(
          databaseId,
          userCollectionId,
          userId, // Removed .`$id` since userId should be a string
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

    // Sign In (Support for Multiple Sessions)
    export async function signIn(email, password) {
      try {
        // Create a new session for the user without checking for existing sessions
        const session = await account.createEmailPasswordSession(email, password);
        console.log("New session created successfully:", session);

        // Retrieve the current account details
        const currentAccount = await account.get();
        if (!currentAccount) throw new Error("Unable to retrieve account.");

        return currentAccount; // Return the account details if successful
      } catch (error) {
        console.error("Error signing in:", error.message);
        throw new Error(error.message || "Error signing in");
      }
    }

    export async function getAllSessions() {
      try {
        const sessions = await account.listSessions();
        if (
          !sessions ||
          !Array.isArray(sessions.sessions) ||
          sessions.sessions.length === 0
        ) {
          console.log("No active sessions found.");
          return { sessions: [] };
        }
        console.log("All active sessions:", sessions);
        return sessions;
      } catch (error) {
        console.error("Error fetching all sessions:", error.message);
        // Instead of throwing an error, return an empty array of sessions
        return { sessions: [] };
      }
    }

    // Updated function to handle sessions and authentication
    export async function handleSignIn(email, password) {
      try {
        // Sign in the user and create a new session
        const session = await account.createEmailPasswordSession(email, password);
        console.log("Session created successfully:", session);

        // Retrieve the current account details after signing in
        const currentAccount = await account.get();
        if (!currentAccount) throw new Error("Unable to retrieve account.");

        return currentAccount; // Return the account details if successful
      } catch (error) {
        console.error("Error signing in:", error.message);
        throw new Error(error.message || "Error signing in");
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

    export async function deleteAllSessionsExceptCurrent() {
      try {
        const sessions = await account.getSessions();
        const currentSession = sessions.current;

        // Delete all sessions except the current one
        const deletePromises = sessions.sessions
          .filter((session) => session.$id !== currentSession.$id)
          .map((session) => account.deleteSession(session.$id));

        await Promise.all(deletePromises);
        console.log("All other sessions deleted successfully.");
      } catch (error) {
        console.error("Error deleting sessions:", error.message);
        throw new Error("Failed to delete other sessions.");
      }
    }

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

        if (!currentUserResponse || currentUserResponse.total === 0) {
          throw new Error("No user document found.");
        }

        const userDocument = currentUserResponse.documents[0]; // Get the user document

        // Check if the role field exists in the document
        if (!userDocument.role) {
          // If the role field is missing, assign a default role (e.g., 'user')
          userDocument.role = "user";
        }

        return userDocument; // Return the user document which includes role
      } catch {
        // Improved error logging
        return null; // Return null if there's an error
      }
    }

    // Get all users
    export async function getAllUsers() {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userCollectionId
        );
        return response.documents; // Adjust based on your actual data structure
      } catch (error) {
        throw new Error("Error fetching users");
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

    export async function getAllUsersFromAuth() {
      try {
        console.log("Fetching users from Appwrite Auth...");

        const response = await usersApi.list(); // Fetch users using the Users API
        console.log("Users fetched successfully from Auth:", response.users);
        return response.users || []; // Return the users array
      } catch (error) {
        console.error("Error fetching users from Appwrite Auth:", error);
        throw new Error(error.message || "Failed to fetch users from Auth.");
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

    export const getEvents = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          eventCollectionId
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
          databaseId,          // Database ID
          eventCollectionId,   // Collection ID
          eventId,             // Document ID to update
          eventData            // Updated data
        );
        return response;        // Return the updated event
      } catch (error) {
        console.error("Error editing event:", error);
        throw new Error("Failed to edit event.");
      }
    };

    export const deleteEvent = async (eventId) => {
      try {
        // Delete the document in the specified database and collection
        const response = await databases.deleteDocument(
          databaseId,         // Database ID
          eventCollectionId,  // Collection ID
          eventId             // ID of the event to delete
        );
        return response;       // Return response from the delete operation
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
        // Convert eventTimeFrom and eventTimeTo to ISO 8601 strings
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

    export const createParticipant = async (participantData) => {
      try {
        // Validate all required fields
        const requiredFields = ['studentId', 'name', 'age', 'sex', 'school', 'year', 'section', 'ethnicGroup', 'eventId'];
        const missingFields = requiredFields.filter(field => !participantData[field]);
    
        if (missingFields.length > 0) {
          throw new Error(`Missing required attributes: ${missingFields.join(', ')}`);
        }
    
        // Validate age
        if (isNaN(parseInt(participantData.age)) || parseInt(participantData.age) <= 0) {
          throw new Error('Invalid age value');
        }
    
        const response = await databases.createDocument(
          databaseId,
          participantCollectionId,
          ID.unique(),
          {
            ...participantData,
            age: parseInt(participantData.age) // Ensure age is stored as a number
          }
        );
        await updateEventParticipants(participantData.eventId, response.$id);
    
        return response;
      } catch (error) {
        console.error("Error creating participant:", error);
        throw error;
      }
    };
    
    

    export const getParticipants = async (eventId) => {
      try {
        // Ensure eventId is defined
        if (!eventId) {
          throw new Error("eventId is missing.");
        }

        const response = await databases.listDocuments(
          databaseId,
          participantCollectionId,
          [Query.equal("eventId", eventId)]
        );

        return response.documents;
      } catch (error) {
        console.error("Error fetching participant:", error);
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
        console.error('Invalid input: eventId, studentId, or name is missing');
        return false;
      }

      try {
        const queries = [Query.equal('eventId', eventId)];
        
        if (studentId) {
          queries.push(Query.equal('studentId', studentId));
        }
        
        if (name) {
          queries.push(Query.equal('name', name));
        }

        const response = await databases.listDocuments(
          databaseId,
          participantCollectionId, 
          queries
        );

        return response.total > 0;
      } catch (error) {
        console.error('Error checking for duplicate participant:', error);
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
        console.error('Invalid input: value or currentEventId is missing');
        return null;
      }

      try {
        const response = await databases.listDocuments(
          databaseId,
          participantCollectionId, 
          [
            Query.or([
              Query.equal('studentId', value),
              Query.equal('name', value)
            ]),
            Query.notEqual('eventId', currentEventId)
          ]
        );

        if (response.documents.length > 0) {
          const participant = response.documents[0];
          console.log('Participant found:', participant);
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
        console.log('No matching participant found for value:', value);
        return null;
      } catch (error) {
        console.error('Error fetching participant data:', error);
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
        console.error('Error changing password:', error);
        throw error;
      }
    }
    
    export async function uploadAvatar(file) {
      try {
        const response = await storage.createFile('avatars', ID.unique(), file);
        return storage.getFileView('avatars', response.$id);
      } catch (error) {
        console.error('Error uploading avatar:', error);
        throw error;
      }
    }
    
    export async function deleteAvatar(fileId) {
      try {
        await storage.deleteFile('avatars', fileId);
      } catch (error) {
        console.error('Error deleting avatar:', error);
        throw error;
      }
    }

    export async function fetchTrendData(startDate, endDate) {
      try {
        const events = await databases.listDocuments(
          databaseId,
          eventCollectionId,
          [
            Query.greaterThanEqual('eventDate', startDate),
            Query.lessThanEqual('eventDate', endDate),
          ]
        );
    
        const participants = await Promise.all(
          events.documents.map(event => 
            databases.listDocuments(
              databaseId,
              participantCollectionId,
              [Query.equal('eventId', event.$id)]
            )
          )
        );
    
        return {
          events: events.documents,
          participants: participants.flatMap(p => p.documents)
        };
      } catch (error) {
        console.error("Error fetching trend data:", error);
        throw error;
      }
    }
    
    export function processTrendData(data) {
      const eventParticipation = data.events.map(event => ({
        date: event.eventDate,
        total: event.participants?.length || 0,
        male: data.participants.filter(p => p.eventId === event.$id && p.sex.toLowerCase() === 'male').length,
        female: data.participants.filter(p => p.eventId === event.$id && p.sex.toLowerCase() === 'female').length,
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
        const group = p.ethnicGroup === "Other" ? p.otherEthnicGroup : p.ethnicGroup;
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
        const events = await databases.listDocuments(databaseId, eventCollectionId)
        const participants = await databases.listDocuments(databaseId, participantCollectionId)
    
        return {
          events: events.documents,
          participants: participants.documents
        }
      } catch (error) {
        console.error("Error fetching report data:", error)
        throw error
      }
    }
    
    export function calculateKPIs(data) {
      const totalParticipants = data.participants.length
      const maleParticipants = data.participants.filter(p => p.sex.toLowerCase() === 'male').length
      const femaleParticipants = data.participants.filter(p => p.sex.toLowerCase() === 'female').length
    
      // Sort events by date
      const sortedEvents = data.events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      
      // Calculate growth rate
      const firstEventParticipants = sortedEvents[0].participants?.length || 0
      const lastEventParticipants = sortedEvents[sortedEvents.length - 1].participants?.length || 0
      const growthRate = ((lastEventParticipants - firstEventParticipants) / firstEventParticipants) * 100
    
      return {
        maleParticipation: (maleParticipants / totalParticipants) * 100,
        femaleParticipation: (femaleParticipants / totalParticipants) * 100,
        eventGrowthRate: growthRate
      }
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
          [
            Query.limit(limit),
            Query.offset((page - 1) * limit),
          ]
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
        await databases.deleteDocument(
          databaseId,
          studentsCollectionId,
          studentId
        );
      } catch (error) {
        console.error("Error deleting student:", error);
        throw error;
      }
    };
  
    export const createQuestion = async (questionData) => {
      return await databases.createDocument(databaseId, questionsCollectionId,           ID.unique(), questionData);
  };
  
  export const listQuestions = async () => {
      return await databases.listDocuments(databaseId, questionsCollectionId);
  };
  
  export const createResponse = async (responseData) => {
      return await databases.createDocument(databaseId, responsesCollectionId,           ID.unique(), responseData);
  };
  
  export const listResponses = async () => {
      return await databases.listDocuments(databaseId, responsesCollectionId);
  };