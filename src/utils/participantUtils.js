import { debounce } from 'lodash';
import { checkDuplicateParticipant, fetchParticipantData } from "@/lib/appwrite";

export const formatStudentId = (input) => {
    const numbers = input.replace(/\D/g, "").slice(0, 8);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4)}`;
  };
  
  export const validateEditParticipantForm = (participant) => {
    const errors = {};
  
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
      (!participant.otherEthnicGroup || participant.otherEthnicGroup.trim() === "")
    ) {
      errors.otherEthnicGroup = "Please specify the ethnic group.";
    }
  
    return errors;
  };
  
  export const validateParticipantForm = (participant) => {
    const errors = {};
  
    if (!participant.studentId || participant.studentId.trim() === "") {
      errors.studentId = "Student ID is required.";
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
      (!participant.otherEthnicGroup || participant.otherEthnicGroup.trim() === "")
    ) {
      errors.otherEthnicGroup = "Please specify the ethnic group.";
    }
  
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

  export const checkDuplicates = async (field, value, currentEventId) => {
    if (!value) {
      return { duplicateError: "", newEntryInfo: "" };
    }
  
    const isDuplicate = await checkDuplicateParticipant(
      currentEventId,
      field === "studentId" ? value : "",
      field === "name" ? value : ""
    );
  
    if (isDuplicate) {
      return {
        duplicateError: `This ${field === "studentId" ? "Student ID" : "Name"} is already added to this event.`,
        newEntryInfo: "",
      };
    } else {
      const existingData = await fetchParticipantData(value, currentEventId);
      if (!existingData) {
        return {
          duplicateError: "",
          newEntryInfo: `This ${field === "studentId" ? "Student ID" : "Name"} is new and not found in any event.`,
        };
      }
    }
  
    return { duplicateError: "", newEntryInfo: "" };
  };
  
  export const debouncedCheckDuplicates = (...args) =>
    new Promise((resolve) => {
      debounce(async () => {
        const result = await checkDuplicates(...args);
        resolve(result);
      }, 300)();
    });
    
    export const isStudentIdComplete = (studentId) => {
      return /^\d{2}-\d{2}-\d{4}$/.test(studentId);
    };

  export const handleAutofill = async (value, currentEventId) => {
    try {
      const data = await fetchParticipantData(value, currentEventId);
      if (data && data.eventId !== currentEventId) {
        return data;
      }
    } catch (error) {
      console.error("Error fetching participant data:", error);
      throw new Error("Error fetching participant data. Please try again.");
    }
    return null;
  };
  
  