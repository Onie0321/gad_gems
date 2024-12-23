import { debounce } from "lodash";
import {
  checkDuplicateParticipant,
  fetchParticipantData,
} from "@/lib/appwrite";

export const formatStudentId = (input) => {
  if (!input) return ""; // Handle null/undefined input
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

  if (!participant.homeAddress || participant.homeAddress.trim() === "") {
    errors.homeAddress = "Home Address is required.";
  }

  // Validate Sex
  if (
    !participant.sex ||
    !["Male", "Female", "Intersex"].includes(participant.sex)
  ) {
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
  // Add validation for required parameters and empty values
  if (!field || !value || !currentEventId || value.trim() === "") {
    return { duplicateError: "", newEntryInfo: "" };
  }

  try {
    const isDuplicate = await checkDuplicateParticipant(
      currentEventId,
      field === "studentId" ? value : "",
      field === "name" ? value : ""
    );

    if (isDuplicate) {
      return {
        duplicateError: `This ${
          field === "studentId" ? "Student ID" : "Name"
        } is already added to this event.`,
        newEntryInfo: "",
      };
    }

    const existingData = await fetchParticipantData(value, currentEventId);
    // Remove the "new entry" message
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

export const isStudentIdComplete = (studentId) => {
  if (!studentId) return false; // Handle null/undefined studentId
  return /^\d{2}-\d{2}-\d{4}$/.test(studentId);
};
export const handleAutofill = async (studentId, currentEventId) => {
  if (!studentId || !currentEventId || !isStudentIdComplete(studentId)) {
    return null;
  }

  try {
    const data = await fetchParticipantData(studentId, currentEventId);
    console.log("Fetched participant data:", data);

    // Return participant data if found in another event
    if (data && data.studentId && data.eventId !== currentEventId) {
      return {
        studentId: data.studentId,
        name: data.name,
        sex: data.sex,
        age: data.age,
        homeAddress: data.homeAddress || "",
        school: data.school,
        year: data.year,
        section: data.section,
        ethnicGroup: data.ethnicGroup,
        otherEthnicGroup: data.otherEthnicGroup || "",
        foundInEvent: true,
        eventName: data.eventName,
      };
    }
    return null;
  } catch (error) {
    console.error("Error in handleAutofill:", error);
    throw new Error("Error fetching participant data");
  }
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
  setShowAutofillDialog
) => {
  try {
    const updatedData = { ...participantData, [field]: value };
    setParticipantData(updatedData);

    if (field === "studentId" || field === "name") {
      if (field === "studentId" && !isStudentIdComplete(value)) {
        setDuplicateErrors((prev) => ({ ...prev, [field]: "" }));
        setNewEntryInfo((prev) => ({ ...prev, [field]: "" }));
        return;
      }

      const result = await debouncedCheckDuplicates(
        field,
        value,
        currentEventId
      );
      if (result) {
        const { duplicateError, newEntryInfo } = result;
        setDuplicateErrors((prev) => ({ ...prev, [field]: duplicateError }));
        setNewEntryInfo((prev) => ({ ...prev, [field]: newEntryInfo }));
      }

      if (value && field === "studentId") {
        const autofillData = await handleAutofill(value, currentEventId);
        if (autofillData) {
          setAutofillData(autofillData);
          setShowAutofillDialog(true);
        }
      }
    }
  } catch (error) {
    console.error("Error in handleInputChange:", error);
    toast.error("An error occurred while processing your input.");
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
