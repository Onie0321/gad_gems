import { debounce } from "lodash";
import {
  checkDuplicateParticipant,
  fetchParticipantData,
} from "@/lib/appwrite";

export const formatStudentId = (input) => {
  if (!input) return "";
  // Remove non-digits
  const numbers = input.replace(/\D/g, "").slice(0, 8);

  // Format as XX-XX-XXXX
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

  if (!participant.homeAddress || participant.homeAddress.trim() === "") {
    errors.homeAddress = "Home Address is required.";
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
    homeAddress: "Home Address",
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
    homeAddress: "Home Address",
    ethnicGroup: "Ethnic Group",
  },
  community: {
    name: "Name",
    sex: "Sex",
    age: "Age",
    homeAddress: "Home Address",
    ethnicGroup: "Ethnic Group",
  },
};

export const validateParticipantForm = (participant, participantType) => {
  console.log(
    "Validating participant data for type:",
    participantType,
    participant
  );
  const errors = {};

  try {
    // Get the required fields for this participant type
    const requiredFieldsForType = requiredFields[participantType];
    if (!requiredFieldsForType) {
      throw new Error(`Invalid participant type: ${participantType}`);
    }

    // Check only the fields that are required for this type
    Object.entries(requiredFieldsForType).forEach(([field, label]) => {
      if (!participant[field] || participant[field].toString().trim() === "") {
        errors[field] = `${label} is required`;
      }
    });

    // Age validation for all types
    if (participant.age) {
      const age = parseInt(participant.age);
      if (isNaN(age) || age <= 0 || age > 120) {
        errors.age = "Please enter a valid age between 1 and 120";
      }
    }

    // Ethnic Group "Other" validation
    if (
      participant.ethnicGroup === "Other" &&
      !participant.otherEthnicGroup?.trim()
    ) {
      errors.otherEthnicGroup = "Please specify the ethnic group";
    }

    const hasErrors = Object.keys(errors).length > 0;
    console.log("Validation results:", { hasErrors, errors });
    return hasErrors ? errors : null;
  } catch (error) {
    console.error("Validation error:", error);
    return { general: "An error occurred during validation" };
  }
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

export const checkDuplicates = async (field, value, currentEventId) => {
  if (!field || !value || !currentEventId || value.trim() === "") {
    return { duplicateError: "", newEntryInfo: "" };
  }

  try {
    const type =
      field === "studentId"
        ? "student"
        : field === "staffFacultyId"
        ? "staff"
        : "community";

    const isDuplicate = await checkDuplicateParticipant(
      currentEventId,
      value,
      type
    );

    if (isDuplicate) {
      return {
        duplicateError: `This ${
          field === "studentId"
            ? "Student ID"
            : field === "staffFacultyId"
            ? "Staff/Faculty ID"
            : "Name"
        } is already added to this event.`,
        newEntryInfo: "",
      };
    }

    return { duplicateError: "", newEntryInfo: "" };
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return {
      duplicateError: "Error checking for duplicates",
      newEntryInfo: "",
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
  const cleanId = staffId.replace(/\D/g, '');
  return cleanId.length === 6;
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
      mappedData.homeAddress = data.homeAddress || data.address;
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
    homeAddress: autofillData.homeAddress || autofillData.address,
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
  const numbers = input.replace(/\D/g, "").slice(0, 3);
  return numbers;
};

// Update initial state helper
export const getInitialParticipantData = (participantType) => {
  const baseFields = {
    name: "",
    sex: "",
    age: "",
    homeAddress: "",
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
  console.log("Cleaning data for type:", participantType, data);

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
    ethnicGroup: ethnicGroup, // Include ethnicGroup in base fields
  };

  switch (participantType) {
    case "student":
      return {
        ...cleanedData,
        studentId: data.studentId?.trim(),
        homeAddress: data.homeAddress?.trim(),
        school: data.school?.trim(),
        year: data.year?.trim(),
        section: data.section?.trim(),
      };

    case "staff":
      return {
        ...cleanedData,
        staffFacultyId: data.staffFacultyId?.trim(),
        address: data.homeAddress?.trim(), // Map homeAddress to address
      };

    case "community":
      return {
        ...cleanedData,
        address: data.homeAddress?.trim(), // Map homeAddress to address
      };

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

export const handleInputChange = async (
  field,
  value,
  participantData,
  setParticipantData,
  currentEventId,
  setDuplicateErrors,
  setNewEntryInfo,
  setAutofillData,
  setShowAutofillDialog,
  participantType
) => {
  try {
    const updatedData = { ...participantData, [field]: value };
    setParticipantData(updatedData);

    // Show specific error messages when fields are empty
    if (!value.trim()) {
      setDuplicateErrors((prev) => ({
        ...prev,
        [field]: `Please enter ${getFieldLabel(field).toLowerCase()}`,
      }));
      setNewEntryInfo((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    // Check if we should validate this field
    const shouldCheck =
      (participantType === "student" &&
        (field === "studentId" || field === "name")) ||
      (participantType === "staff" &&
        (field === "staffFacultyId" || field === "name")) ||
      (participantType === "community" && field === "name");

    if (!shouldCheck) return;

    // Check for duplicates in the current event first (case-insensitive)
    const duplicateInEvent = await checkDuplicateInCurrentEvent(
      currentEventId,
      field,
      value.toLowerCase(),
      participantType
    );

    if (duplicateInEvent) {
      const message = getParticipantTypeMessage(participantType, "duplicate");
      setDuplicateErrors((prev) => ({
        ...prev,
        [field]: message,
      }));
      setNewEntryInfo((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    // Then check for duplicates in other events (case-insensitive)
    const result = await debouncedCheckDuplicates(
      field,
      value.toLowerCase(),
      currentEventId
    );

    if (result.duplicateError) {
      setDuplicateErrors((prev) => ({
        ...prev,
        [field]: result.duplicateError,
      }));
      setNewEntryInfo((prev) => ({ ...prev, [field]: "" }));

      // Check for autofill data
      const autofillData = await handleAutofill(
        value,
        currentEventId,
        participantType
      );
      if (autofillData) {
        setAutofillData(autofillData);
        setShowAutofillDialog(true);
      }
    } else {
      setDuplicateErrors((prev) => ({ ...prev, [field]: "" }));
      const message = getParticipantTypeMessage(participantType, "new");
      setNewEntryInfo((prev) => ({
        ...prev,
        [field]: message,
      }));
    }
  } catch (error) {
    console.error("Error in handleInputChange:", error);
    setDuplicateErrors((prev) => ({
      ...prev,
      [field]: "Error checking participant information",
    }));
  }
};

const getParticipantTypeMessage = (type, status) => {
  switch (type) {
    case "student":
      return status === "duplicate"
        ? "This student is already added to the current event."
        : "This is a new student.";
    case "staff":
      return status === "duplicate"
        ? "This staff/faculty member is already added to the current event."
        : "This is a new staff/faculty member.";
    case "community":
      return status === "duplicate"
        ? "This community member is already added to the current event."
        : "This is a new community member.";
    default:
      return "";
  }
};

// Add this new function to check duplicates in current event
export const checkDuplicateInCurrentEvent = async (
  eventId,
  field,
  value,
  participantType
) => {
  try {
    let query = [Query.equal("eventId", eventId)];

    switch (participantType) {
      case "student":
        if (field === "studentId") {
          query.push(Query.equal("studentId", value));
        } else if (field === "name") {
          query.push(Query.equal("name", value));
        }
        break;
      case "staff":
        if (field === "staffFacultyId") {
          query.push(Query.equal("staffFacultyId", value));
        } else if (field === "name") {
          query.push(Query.equal("name", value));
        }
        break;
      case "community":
        query.push(Query.equal("name", value));
        break;
    }

    const response = await databases.listDocuments(
      databaseId,
      participantCollectionId,
      query
    );

    return response.documents.length > 0;
  } catch (error) {
    console.error("Error checking duplicate in current event:", error);
    return false;
  }
};

// Helper function to get field label
const getFieldLabel = (field) => {
  switch (field) {
    case "studentId":
      return "Student ID";
    case "staffFacultyId":
      return "Staff/Faculty ID";
    case "name":
      return "Name";
    default:
      return field;
  }
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
      participantCollectionId,
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
