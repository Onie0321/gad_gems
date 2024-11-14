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
  
  export const appwriteConfig = {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    userCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
    eventCollectionId: process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID,
    participantCollectionId:
      process.env.NEXT_PUBLIC_APPWRITE_PARTICIPANT_COLLECTION_ID,
    responseCollectionId:
      process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID,
    employeesCollectionId:
      process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_COLLECTION_ID,
    exceluploadsCollectionId:
      process.env.NEXT_PUBLIC_APPWRITE_EXCELUPLOADS_COLLECTION_ID,
    newsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_NEWS_COLLECTION_ID,
    messagesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID,
    archivesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ARCHIVES_COLLECTION_ID,
    servicesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SERVICES_COLLECTION_ID,
  };
  
  const client = new Client();
  
  client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);
  
  const account = new Account(client);
  //const avatars = new Avatars(client);
  export const databases = new Databases(client);
  const storage = new Storage(client);
  
  export async function createUser(email, password, name, role = "user") {
    try {
      // Create the new account
      const newAccount = await account.create(ID.unique(), email, password, name);
      if (!newAccount) throw new Error("Account creation failed.");
  
      // Generate an avatar URL for the user
      //  const avatarUrl = avatars.getInitials(username);
  
      // Create the user document in the database with the role field
      const newUser = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
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
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
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
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        userId.$id
      );
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
      const sessions = await account.listSessions()
      if (!sessions || !Array.isArray(sessions.sessions) || sessions.sessions.length === 0) {
        console.log("No active sessions found.")
        return { sessions: [] }
      }
      console.log("All active sessions:", sessions)
      return sessions
    } catch (error) {
      console.error("Error fetching all sessions:", error.message)
      // Instead of throwing an error, return an empty array of sessions
      return { sessions: [] }
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
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
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
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId
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