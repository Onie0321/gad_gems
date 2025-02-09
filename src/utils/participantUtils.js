import { debounce } from "lodash";
import { Query } from "appwrite";
import {
  checkDuplicateParticipant,
  fetchParticipantData,
  databases,
  databaseId,
  studentsCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";

export const formatStudentId = (input) => {
  if (!input) return "";
  const numbers = input.replace(/\D/g, "").slice(0, 8);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4)}`;
};

export const validateEditParticipantForm = (participant) => {
  const errors = {};

  // Add null check for participant object
  if (!participant) {
    return { general: "Invalid participant data" };
  }

  // Validate Name
  if (!participant.name || participant.name.trim() === "") {
    errors.name = "Name is required.";
  }

  // Validate Age
  if (
    !participant.age ||
    isNaN(participant.age) ||
    participant.age <= 0 ||
    participant.age > 125
  ) {
    errors.age = "Age must be between 1 and 125.";
  }

  if (!participant.address || participant.address.trim() === "") {
    errors.address = "Address is required.";
  }

  // Validate Sex
  if (!participant.sex || !["Male", "Female"].includes(participant.sex)) {
    errors.sex = "Sex is required and must be Male or Female.";
  }

  // Validate School
  if (!participant.school || participant.school.trim() === "") {
    errors.school = "School is required.";
  }

  // Validate Year
  if (!participant.year || participant.year.trim() === "") {
    errors.year = "Year is required.";
  }

  // Validate Section
  if (!participant.section || participant.section.trim() === "") {
    errors.section = "Section is required.";
  }

  // Validate Ethnic Group
  if (!participant.ethnicGroup || participant.ethnicGroup.trim() === "") {
    errors.ethnicGroup = "Ethnic group is required.";
  }

  if (
    participant.ethnicGroup === "Other" &&
    (!participant.otherEthnicGroup ||
      participant.otherEthnicGroup.trim() === "")
  ) {
    errors.otherEthnicGroup = "Please specify the ethnic group.";
  }

  return errors;
};

// Define required fields for each participant type
export const requiredFields = {
  student: {
    studentId: "Student ID",
    name: "Name",
    sex: "Sex",
    age: "Age",
    address: "Address",
    school: "School",
    year: "Year",
    section: "Section",
    ethnicGroup: "Ethnic Group",
  },
  staff: {
    staffFacultyId: "Staff/Faculty ID",
    name: "Name",
    sex: "Sex",
    age: "Age",
    address: "Address",
    ethnicGroup: "Ethnic Group",
  },
  community: {
    name: "Name",
    sex: "Sex",
    age: "Age",
    address: "Address",
    ethnicGroup: "Ethnic Group",
  },
};

export const validateParticipantForm = (data, type) => {
  console.log("Starting validation for type:", type);
  console.log("Data to validate:", data);
  console.log("staffFacultyId type:", typeof data.staffFacultyId);
  console.log("staffFacultyId value:", data.staffFacultyId);
  
  const errors = {};

  // Common validations
  if (!data.name?.trim()) {
    errors.name = "Name is required";
  }

  if (!data.sex) {
    errors.sex = "Sex is required";
  }

  if (!data.age) {
    errors.age = "Age is required";
  } else {
    const age = parseInt(data.age);
    if (isNaN(age) || age <= 0 || age > 125) {
      errors.age = "Age must be between 1 and 125";
    }
  }

  if (!data.address?.trim()) {
    errors.address = "Address is required";
  }

  if (!data.ethnicGroup) {
    errors.ethnicGroup = "Ethnic group is required";
  } else if (data.ethnicGroup === "Other" && !data.otherEthnicGroup?.trim()) {
    errors.otherEthnicGroup = "Please specify your ethnic group";
  }

  // Type-specific validations
  switch (type) {
    case "student":
      if (!data.studentId) {
        errors.studentId = "Student ID is required";
      } else if (!isStudentIdComplete(data.studentId)) {
        errors.studentId = "Invalid Student ID format";
      }
      if (!data.school) errors.school = "School is required";
      if (!data.year) errors.year = "Year level is required";
      if (!data.section) errors.section = "Section is required";
      break;

    case "staff":
      if (!data.staffFacultyId) {
        errors.staffFacultyId = "Staff/Faculty ID is required";
      } else {
        // Handle both string and number types
        const staffId = typeof data.staffFacultyId === 'string' 
          ? data.staffFacultyId.replace(/\D/g, '')
          : data.staffFacultyId.toString();

        console.log("Processed staffId:", staffId);
        console.log("staffId length:", staffId.length);

        if (staffId.length !== 3) {
          errors.staffFacultyId = "Staff/Faculty ID must be exactly 3 digits";
        } else if (!/^\d{3}$/.test(staffId)) {
          errors.staffFacultyId = "Staff/Faculty ID must contain only digits";
        }
      }
      break;
  }

  console.log("Validation complete. Errors found:", errors);
  return errors;
};

export const capitalizeWords = (input) => {
  return input.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const schoolOptions = [
  { name: "School of Accountancy and Business Management", abbr: "SABM" },
  { name: "School of Agricultural Science", abbr: "SAS" },
  { name: "School of Arts and Sciences", abbr: "SASc" },
  { name: "School of Education", abbr: "SED" },
  { name: "School of Engineering", abbr: "SOE" },
  { name: "School of Fisheries and Oceanic Science", abbr: "SFOS" },
  { name: "School of Forestry and Environmental Sciences", abbr: "SFES" },
  { name: "School of Industrial Technology", abbr: "SIT" },
  { name: "School of Information Technology", abbr: "SITech" },
];

export const checkDuplicates = async (field, value, currentEventId, participantType) => {
  if (!field || !value || !currentEventId || value.trim() === "") {
    return { error: "", participant: null };
  }

  try {
    let collectionId;
    let query;

    switch (participantType) {
      case "student":
        collectionId = studentsCollectionId;
        query = field === "studentId" ? 
          Query.equal("studentId", value) : 
          Query.equal("name", value);
        break;
      case "staff":
        collectionId = staffFacultyCollectionId;
        // For staff ID, ensure we're sending an integer
        if (field === "staffFacultyId") {
          const staffId = parseInt(value.replace(/\D/g, ''));
          // Only proceed if we have a valid number
          if (isNaN(staffId)) {
            return { error: "", participant: null };
          }
          query = Query.equal("staffFacultyId", staffId);
        } else {
          query = Query.equal("name", value);
        }
        break;
      case "community":
        collectionId = communityCollectionId;
        query = Query.equal("name", value);
        break;
      default:
        throw new Error("Invalid participant type");
    }

    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.equal("eventId", currentEventId),
        query
      ]
    );

    if (response.documents.length > 0) {
      return {
        error: `This ${field === "studentId" ? "Student ID" : 
               field === "staffFacultyId" ? "Staff/Faculty ID" : 
               "Name"} is already registered for this event.`,
        participant: response.documents[0]
      };
    }

    // Check in other events
    const otherEventsResponse = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.notEqual("eventId", currentEventId),
        query
      ]
    );

    if (otherEventsResponse.documents.length > 0) {
      return {
        error: "",
        participant: otherEventsResponse.documents[0]
      };
    }

    return { error: "", participant: null };
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return {
      error: "Error checking for duplicates",
      participant: null
    };
  }
};

export const debouncedCheckDuplicates = (...args) =>
  new Promise((resolve) => {
    debounce(async () => {
      try {
        const result = await checkDuplicates(...args);
        resolve(result);
      } catch (error) {
        console.error("Error in debouncedCheckDuplicates:", error);
        resolve({
          duplicateError: "Error checking duplicates",
          newEntryInfo: "",
        });
      }
    }, 300)();
  });

export const isIdComplete = (id, type) => {
  if (!id) return false;

  // Remove any non-digit characters
  const cleanId = id.replace(/\D/g, '');

  // For student IDs, we expect 8 digits (XX-XX-XXXX format)
  if (type === 'student') {
    return cleanId.length === 8;
  }

  // For staff IDs, we expect 6 digits (XX-XXXX format)
  if (type === 'staff') {
    return cleanId.length === 6;
  }

  return false;
};

export const isStudentIdComplete = (studentId) => {
  if (!studentId) return false;
  const cleanId = studentId.replace(/\D/g, '');
  return cleanId.length === 8;
};

export const isStaffIdComplete = (staffId) => {
  if (!staffId) return false;
  const numbers = staffId.replace(/\D/g, '');
  return numbers.length === 3;
};

export const handleAutofill = async (
  identifier,
  currentEventId,
  participantType
) => {
  // Return early if required params are missing
  if (!identifier || !currentEventId || !participantType) {
    return null;
  }

  // For student/staff, check if ID format is valid
  if (
    (participantType === "student" || participantType === "staff") &&
    !isIdComplete(identifier, participantType)
  ) {
    return null;
  }

  // For community members, check if name is long enough
  if (participantType === "community" && identifier.length < 3) {
    return null;
  }

  try {
    const data = await fetchParticipantData(
      identifier,
      currentEventId,
      participantType
    );
    console.log("Fetched participant data:", data);

    if (data && data.eventId !== currentEventId) {
      // Map the data based on participant type
      const mappedData = {
        ...data,
        foundInEvent: true,
        eventName: data.eventName,
        participantType: participantType,
      };

      // Add specific fields based on participant type
      switch (participantType) {
        case "student":
          mappedData.studentId = data.studentId;
          mappedData.school = data.school;
          mappedData.year = data.year;
          mappedData.section = data.section;
          break;
        case "staff":
          mappedData.staffFacultyId = data.staffFacultyId;
          break;
        case "community":
          // Community members only need the base fields
          break;
      }

      // Ensure common fields are mapped correctly
      mappedData.name = data.name;
      mappedData.sex = data.sex;
      mappedData.age = data.age;
      mappedData.address = data.address;
      mappedData.ethnicGroup = data.ethnicGroup;
      mappedData.otherEthnicGroup = data.otherEthnicGroup;

      return mappedData;
    }
    return null;
  } catch (error) {
    console.error("Error in handleAutofill:", error);
    throw new Error("Error fetching participant data");
  }
};

// Add a new function to handle the autofill confirmation
export const handleAutofillConfirm = (autofillData, setParticipantData) => {
  const mappedData = {
    name: autofillData.name,
    sex: autofillData.sex,
    age: autofillData.age,
    address: autofillData.address,
    ethnicGroup: autofillData.ethnicGroup,
    otherEthnicGroup: autofillData.otherEthnicGroup || "",
  };

  // Add type-specific fields
  switch (autofillData.participantType) {
    case "student":
      mappedData.studentId = autofillData.studentId;
      mappedData.school = autofillData.school;
      mappedData.year = autofillData.year;
      mappedData.section = autofillData.section;
      break;
    case "staff":
      mappedData.staffFacultyId = autofillData.staffFacultyId;
      break;
    case "community":
      // No additional fields needed
      break;
  }

  setParticipantData(mappedData);
};

export const formatStaffFacultyId = (input) => {
  if (!input) return "";
  // Only keep first 3 digits, no prefix
  return input.replace(/\D/g, "").slice(0, 3);
};

// Update initial state helper
export const getInitialParticipantData = (participantType) => {
  const baseFields = {
    name: "",
    sex: "",
    age: "",
    address: "",
    ethnicGroup: "",
    otherEthnicGroup: "",
  };

  switch (participantType) {
    case "student":
      return {
        ...baseFields,
        studentId: "",
        school: "",
        year: "",
        section: "",
      };
    case "staff":
      return {
        ...baseFields,
        staffFacultyId: "",
      };
    case "community":
      return baseFields;
    default:
      return baseFields;
  }
};

// Helper function to clean participant data before submission
export const cleanParticipantData = (data, participantType) => {
  console.log("Cleaning data for type:", participantType);
  console.log("Raw data:", data);
  console.log("staffFacultyId before cleaning:", data.staffFacultyId);
  console.log("staffFacultyId type:", typeof data.staffFacultyId);

  // Handle ethnicGroup logic
  let ethnicGroup = data.ethnicGroup;
  if (data.ethnicGroup === "Other" && data.otherEthnicGroup) {
    ethnicGroup = data.otherEthnicGroup.trim();
  }

  // Base fields for all types
  const cleanedData = {
    name: data.name?.trim(),
    age: data.age,
    sex: data.sex,
    address: data.address?.trim(),
    ethnicGroup: ethnicGroup,
  };

  switch (participantType) {
    case "student":
      return {
        ...cleanedData,
        studentId: data.studentId?.trim(),
        school: data.school?.trim(),
        year: data.year?.trim(),
        section: data.section?.trim(),
      };

    case "staff":
      // Handle staffFacultyId conversion safely
      const staffId = typeof data.staffFacultyId === 'string' 
        ? parseInt(data.staffFacultyId.replace(/\D/g, '') || '0')
        : typeof data.staffFacultyId === 'number' 
          ? data.staffFacultyId 
          : 0;

      console.log("Processed staffId:", staffId);
      console.log("staffId type:", typeof staffId);

      return {
        ...cleanedData,
        staffFacultyId: staffId,
      };

    case "community":
      return cleanedData;

    default:
      throw new Error(`Invalid participant type: ${participantType}`);
  }
};

export const handleParticipantTypeChange = (
  type,
  setParticipantType,
  setParticipantData,
  setErrors
) => {
  setParticipantType(type);
  setParticipantData(getInitialParticipantData(type));
  setErrors({});
};

export const updateParticipantCounts = (
  participants,
  currentEventId,
  setTotalParticipants,
  setTotalMaleParticipants,
  setTotalFemaleParticipants
) => {
  const currentEventParticipants = participants.filter(
    (p) => p.eventId === currentEventId
  );
  setTotalParticipants(currentEventParticipants.length);
  setTotalMaleParticipants(
    currentEventParticipants.filter((p) => p.sex === "Male").length
  );
  setTotalFemaleParticipants(
    currentEventParticipants.filter((p) => p.sex === "Female").length
  );
};

// Add more utility functions as needed

export const checkDuplicateParticipantInEvent = async (
  eventId,
  identifier,
  type
) => {
  if (!eventId || !identifier) return null;

  try {
    const participants = await databases.listDocuments(
      databaseId,
      studentsCollectionId,
      [
        Query.notEqual("eventId", eventId),
        type === "student"
          ? Query.equal("studentId", identifier)
          : type === "staff"
          ? Query.equal("staffFacultyId", identifier)
          : Query.equal("name", identifier),
      ]
    );

    return participants.documents.length > 0 ? participants.documents[0] : null;
  } catch (error) {
    console.error("Error checking duplicate participant:", error);
    return null;
  }
};
