// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7XPQSfc_CMmz3jgQTe-lPugqgifjEZyU",
  authDomain: "gad-repo-27c42.firebaseapp.com",
  projectId: "gad-repo-27c42",
  storageBucket: "gad-repo-27c42.firebasestorage.app",
  messagingSenderId: "81596867567",
  appId: "1:81596867567:web:53d878983aadb03421cc1a",
  measurementId: "G-V92SKY5QGZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only on client-side
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Collection names (equivalent to Appwrite collections)
export const COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'events',
  STUDENTS: 'students',
  QUESTIONS: 'questions',
  RESPONSES: 'responses',
  FORMS: 'forms',
  EMPLOYEES: 'employees',
  EMPLOYEE_SURVEYS: 'employeeSurveys',
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOGS: 'activityLogs',
  NEWS: 'news',
  STAFF_FACULTY: 'staffFaculty',
  COMMUNITY: 'community',
  ACADEMIC_PERIODS: 'academicPeriods',
  RESET_TOKENS: 'resetTokens'
};

export const PERIOD_TYPES = {
  FIRST_SEMESTER: "First Semester",
  SECOND_SEMESTER: "Second Semester",
  SUMMER: "Summer",
};

// Export Firebase instances
export { app, auth, db, storage };

// Export analytics with safety check
export const getAnalyticsInstance = () => {
  if (typeof window !== 'undefined' && analytics) {
    return analytics;
  }
  return null;
};

// Helper function to convert Appwrite timestamp to Firebase timestamp
export const toFirebaseTimestamp = (date) => {
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date));
  }
  return serverTimestamp();
};

// Helper function to convert Firebase timestamp to Date
export const fromFirebaseTimestamp = (timestamp) => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  return timestamp;
};

// Helper function to generate unique IDs (equivalent to Appwrite's ID.unique())
export const generateUniqueId = () => {
  return doc(collection(db, 'temp')).id;
};

// Authentication functions
export const createUser = async (email, password, name, role = "user") => {
  try {
    // Create Firebase auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    const userDoc = {
      accountId: user.uid,
      email: email,
      name: name,
      role: role,
      approvalStatus: "pending",
      isFirstLogin: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userDoc);

    // Log activity
    await logActivity(user.uid, "User Registered: " + name);

    // Create notification for admin
    await createNotification({
      userId: "admin",
      type: "account",
      title: "New User Registration",
      message: `New user ${name} has registered and requires approval.`,
      actionType: "user_registration",
      status: "pending"
    });

    return { ...userDoc, $id: user.uid };
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("Email already exists");
    }
    throw new Error(error.message || "Failed to create user");
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("SignIn error:", error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error("Invalid email or password");
    }
    throw new Error(error.message || "Error signing in");
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    // Get user document from Firestore
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (userDoc.exists()) {
      return { ...userDoc.data(), $id: user.uid };
    }
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const updateUserFirstLogin = async (userId) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      isFirstLogin: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating user first login status:", error);
  }
};

export const updateUser = async (userId, updatedData) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(error.message || "Failed to update user.");
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  } catch (error) {
    throw new Error(error.message || "Failed to delete user.");
  }
};

// Event functions
export const createEvent = async (eventData) => {
  try {
    const eventDoc = {
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isArchived: false
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), eventDoc);
    return { ...eventDoc, $id: docRef.id };
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const getEvents = async (userId = null) => {
  try {
    let q = collection(db, COLLECTIONS.EVENTS);
    
    if (userId) {
      q = query(q, where("createdBy", "==", userId));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id }));
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const getEvent = async (eventId) => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTIONS.EVENTS, eventId));
    if (docSnap.exists()) {
      return { ...docSnap.data(), $id: docSnap.id };
    }
    return null;
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
};

export const editEvent = async (eventId, eventData) => {
  try {
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error editing event:", error);
    throw new Error("Failed to edit event.");
  }
};

// Alias for editEvent to maintain compatibility
export const updateEvent = editEvent;

export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.EVENTS, eventId));
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Failed to delete event.");
  }
};

// Participant functions
export const createParticipant = async (participantData) => {
  try {
    const participantDoc = {
      ...participantData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isArchived: false
    };
    
    // Determine the correct collection based on participant type
    let collectionName = COLLECTIONS.STUDENTS; // default
    
    if (participantData.participantType === "staff") {
      collectionName = COLLECTIONS.STAFF_FACULTY;
    } else if (participantData.participantType === "community") {
      collectionName = COLLECTIONS.COMMUNITY;
    }
    // For "student" type or undefined, use STUDENTS collection
    
    const docRef = await addDoc(collection(db, collectionName), participantDoc);
    return { ...participantDoc, $id: docRef.id };
  } catch (error) {
    console.error("Error creating participant:", error);
    throw error;
  }
};

export const getParticipants = async (eventId = null, userId = null) => {
  try {
    const constraints = [];
    
    if (eventId) {
      constraints.push(where("eventId", "==", eventId));
    }
    if (userId) {
      constraints.push(where("createdBy", "==", userId));
    }
    
    // Fetch from all participant collections
    const [studentsQuery, staffQuery, communityQuery] = [
      collection(db, COLLECTIONS.STUDENTS),
      collection(db, COLLECTIONS.STAFF_FACULTY),
      collection(db, COLLECTIONS.COMMUNITY)
    ];
    
    const [studentsSnapshot, staffSnapshot, communitySnapshot] = await Promise.all([
      getDocs(constraints.length > 0 ? query(studentsQuery, ...constraints) : studentsQuery),
      getDocs(constraints.length > 0 ? query(staffQuery, ...constraints) : staffQuery),
      getDocs(constraints.length > 0 ? query(communityQuery, ...constraints) : communityQuery)
    ]);
    
    const students = studentsSnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id, participantType: "student" }));
    const staff = staffSnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id, participantType: "staff" }));
    const community = communitySnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id, participantType: "community" }));
    
    return [...students, ...staff, ...community];
  } catch (error) {
    console.error("Error fetching participants:", error);
    throw error;
  }
};

export const updateParticipant = async (participantId, updatedData) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.STUDENTS, participantId), {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating participant:", error);
    throw error;
  }
};

export const deleteParticipant = async (participantId) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, participantId));
  } catch (error) {
    console.error("Error deleting participant:", error);
    throw error;
  }
};

// Notification functions
export const createNotification = async (notificationData) => {
  try {
    const notificationDoc = {
      ...notificationData,
      timestamp: serverTimestamp(),
      read: false
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notificationDoc);
    return { ...notificationDoc, $id: docRef.id };
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

export const getNotifications = async (userId, role) => {
  try {
    let q = collection(db, COLLECTIONS.NOTIFICATIONS);
    
    if (role === "admin") {
      q = query(q, 
        where("type", "in", ["approval", "account", "info"]),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(q, 
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
      read: true
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Activity logging
export const logActivity = async (userId, activityType) => {
  try {
    const activityDoc = {
      userId,
      activityType,
      timestamp: serverTimestamp()
    };
    
    await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), activityDoc);
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
};

// Real-time subscriptions
export const subscribeToCollection = (collectionName, callback, constraints = []) => {
  let q = collection(db, collectionName);
  
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  
  return onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id }));
    callback(documents);
  });
};

// File upload functions
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

// Google OAuth
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

// Password reset
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset:", error);
    throw error;
  }
};

export const confirmPasswordResetCode = async (oobCode, newPassword) => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
  } catch (error) {
    console.error("Error confirming password reset:", error);
    throw error;
  }
};

// Batch operations
export const batchWrite = async (operations) => {
  try {
    const batch = writeBatch(db);
    
    operations.forEach(({ type, collection, id, data }) => {
      const docRef = doc(db, collection, id);
      
      switch (type) {
        case 'set':
          batch.set(docRef, data);
          break;
        case 'update':
          batch.update(docRef, data);
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error in batch write:", error);
    throw error;
  }
};

// Additional functions needed by the app
export const getAllUsers = async (email) => {
  try {
    const q = query(collection(db, COLLECTIONS.USERS), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking existing users:", error);
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const fetchActivityLogs = async () => {
  try {
    const q = query(collection(db, COLLECTIONS.ACTIVITY_LOGS), orderBy("timestamp", "desc"), limit(1000));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    throw error;
  }
};

export const getAllEventsAndParticipants = async () => {
  try {
    const eventsQuery = query(collection(db, COLLECTIONS.EVENTS), orderBy("eventDate", "desc"));
    const participantsQuery = collection(db, COLLECTIONS.STUDENTS);
    
    const [eventsSnapshot, participantsSnapshot] = await Promise.all([
      getDocs(eventsQuery),
      getDocs(participantsQuery)
    ]);
    
    return {
      events: eventsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })),
      participants: participantsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
    };
  } catch (error) {
    console.error("Error fetching events and participants:", error);
    throw error;
  }
};

export const getCurrentAcademicPeriod = async () => {
  try {
    console.log("Fetching current academic period...");
    const q = query(
      collection(db, COLLECTIONS.ACADEMIC_PERIODS),
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const period = querySnapshot.docs[0];
      const result = { ...period.data(), id: period.id };
      console.log("Found active academic period:", result);
      return result;
    }
    
    // If no active period found, try to get the most recent period regardless of status
    const fallbackQuery = query(
      collection(db, COLLECTIONS.ACADEMIC_PERIODS),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    
    const fallbackSnapshot = await getDocs(fallbackQuery);
    if (!fallbackSnapshot.empty) {
      const period = fallbackSnapshot.docs[0];
      const result = { ...period.data(), id: period.id };
      console.warn("No active academic period found. Using most recent period:", result);
      return result;
    }
    
    // If no academic periods exist at all, return null
    console.warn("No academic periods found in the database");
    return null;
  } catch (error) {
    console.error("Error getting current academic period:", error);
    // Return null instead of throwing to allow graceful handling
    return null;
  }
};

export const createAcademicPeriod = async (startDate, endDate, schoolYear, periodType) => {
  try {
    const periodDoc = {
      startDate,
      endDate,
      schoolYear,
      periodType,
      isActive: true,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.ACADEMIC_PERIODS), periodDoc);
    return { ...periodDoc, id: docRef.id };
  } catch (error) {
    console.error("Error creating academic period:", error);
    throw error;
  }
};

export const getAllEmployeeData = async () => {
  try {
    const [employeesSnapshot, surveysSnapshot] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.EMPLOYEES)),
      getDocs(collection(db, COLLECTIONS.EMPLOYEE_SURVEYS))
    ]);
    
    const employees = employeesSnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id }));
    const surveys = surveysSnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id }));
    
    return employees.map(employee => {
      const survey = surveys.find(s => s.employeeDataId === employee.$id);
      return {
        ...employee,
        surveyData: survey || { questionsAnswers: [] }
      };
    });
  } catch (error) {
    console.error("Error fetching employee data:", error);
    throw error;
  }
};

export const processAndImportSingleEmployee = async (data) => {
  try {
    const employeeDoc = {
      email: data.email,
      name: data.name,
      age: data.age,
      birth: data.birth,
      address: data.address,
      cpNumber: data.cpNumber,
      sexAtBirth: data.sexAtBirth,
      gender: data.gender,
      genderIfNonHeterosexual: data.genderIfNonHeterosexual || data['genderIfNon-Heterosexual'],
      timeStamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.EMPLOYEES), employeeDoc);
    
    if (data.questions && data.answers) {
      const surveyDoc = {
        employeeDataId: docRef.id,
        questions: data.questions,
        answers: data.answers
      };
      
      await addDoc(collection(db, COLLECTIONS.EMPLOYEE_SURVEYS), surveyDoc);
    }
    
    return { ...employeeDoc, $id: docRef.id };
  } catch (error) {
    console.error("Error processing employee data:", error);
    throw error;
  }
};

export const listQuestions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.QUESTIONS));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id }));
  } catch (error) {
    console.error("Error listing questions:", error);
    throw error;
  }
};

export const listResponses = async () => {
  try {
    const q = query(collection(db, COLLECTIONS.RESPONSES), limit(100));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id }));
  } catch (error) {
    console.error("Error listing responses:", error);
    throw error;
  }
};

export const createQuestion = async (questionData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.QUESTIONS), questionData);
    return { ...questionData, $id: docRef.id };
  } catch (error) {
    console.error("Error creating question:", error);
    throw error;
  }
};

export const createResponse = async (responseData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.RESPONSES), responseData);
    return { ...responseData, $id: docRef.id };
  } catch (error) {
    console.error("Error creating response:", error);
    throw error;
  }
};

export const updateUserStatus = async (userId, newStatus) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      approvalStatus: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

export const logSignOutActivity = async (userId, userRole) => {
  try {
    await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), {
      userId,
      activityType: `${userRole} Sign Out`,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging sign out activity:", error);
  }
};

export const updateEventVisibility = async (eventId, showOnHomepage) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
      showOnHomepage,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating event visibility:", error);
    throw error;
  }
};

export const fetchTotals = async (academicPeriodId) => {
  try {
    const eventsQuery = query(
      collection(db, COLLECTIONS.EVENTS),
      where("academicPeriodId", "==", academicPeriodId),
      where("isArchived", "==", false)
    );
    
    const participantsQuery = query(
      collection(db, COLLECTIONS.STUDENTS),
      where("isArchived", "==", false)
    );
    
    const [eventsSnapshot, participantsSnapshot] = await Promise.all([
      getDocs(eventsQuery),
      getDocs(participantsQuery)
    ]);
    
    const events = eventsSnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id }));
    const participants = participantsSnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id }));
    
    // Calculate totals
    const totalEvents = events.length;
    const academicEvents = events.filter(event => event.eventType === "Academic").length;
    const nonAcademicEvents = events.filter(event => event.eventType === "Non-Academic").length;
    const totalParticipants = participants.length;
    
    return {
      totalEvents,
      academicEvents,
      nonAcademicEvents,
      totalParticipants,
      events,
      participants
    };
  } catch (error) {
    console.error("Error fetching totals:", error);
    throw error;
  }
};

// Function to fetch officer events
export const fetchOfficerEvents = async (userId) => {
  try {
    console.log("Fetching officer events for user:", userId);
    const [eventsSnapshot, currentPeriod] = await Promise.all([
      getDocs(query(
        collection(db, COLLECTIONS.EVENTS),
        where("createdBy", "==", userId),
        orderBy("createdAt", "desc")
      )),
      getCurrentAcademicPeriod()
    ]);
    
    const events = eventsSnapshot.docs.map(doc => ({ ...doc.data(), $id: doc.id }));
    console.log("Fetched events:", events.length, "Current period:", currentPeriod);
    
    return {
      events,
      currentPeriod
    };
  } catch (error) {
    console.error("Error fetching officer events:", error);
    throw error;
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



// Function to archive current period
export const archiveCurrentPeriod = async (periodId) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.ACADEMIC_PERIODS, periodId), {
      isActive: false,
      archivedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error archiving period:", error);
    throw error;
  }
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

    // Note: Data archival and officer notifications would need to be implemented
    // based on your specific requirements for Firebase

    return newPeriod;
  } catch (error) {
    console.error("Error creating new academic period:", error);
    throw error;
  }
};

// Function to fetch participant data for autofill
export const fetchParticipantData = async (
  identifier,
  currentEventId,
  participantType
) => {
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
    // Determine the field to search based on participant type
    const searchField = participantType === "student" 
      ? "studentId" 
      : participantType === "staff" 
        ? "staffFacultyId" 
        : "name";

    // Query for participants with the given identifier in other events
    const participantsQuery = query(
      collection(db, COLLECTIONS.STUDENTS), // Use STUDENTS collection for all types
      where(searchField, "==", identifier),
      where("eventId", "!=", currentEventId) // Exclude current event
    );

    const participantsSnapshot = await getDocs(participantsQuery);

    if (!participantsSnapshot.empty) {
      const participant = participantsSnapshot.docs[0].data();
      console.log("Found participant in database:", participant);

      try {
        // Get the event name
        const eventDoc = await getDoc(doc(db, COLLECTIONS.EVENTS, participant.eventId));
        const event = eventDoc.exists() ? eventDoc.data() : null;
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
          eventName: event?.eventName || "Unknown Event",
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
};

// Function to check for duplicate participants
export const checkDuplicateParticipant = async (eventId, identifier) => {
  try {
    const participantsQuery = query(
      collection(db, COLLECTIONS.STUDENTS),
      where("eventId", "==", eventId),
      where("studentId", "==", identifier)
    );

    const snapshot = await getDocs(participantsQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking duplicate participant:", error);
    return false;
  }
};

// Export all functions for backward compatibility
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updatePassword,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
};
