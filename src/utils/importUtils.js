import * as XLSX from "xlsx";
import { ID, Query } from "appwrite";
import {
  databases,
  databaseId,
  eventCollectionId,
  participantCollectionId,
} from "@/lib/appwrite";

// Utility to format dates for database storage
export const formatDateForDatabase = (dateString) => {
  if (!dateString) {
    console.warn("Empty date value provided.");
    return null;
  }

  // First, try parsing as a regular date string
  let date = new Date(dateString);

  // If that fails, try parsing as an Excel serial number
  if (isNaN(date.getTime())) {
    const excelDate = XLSX.SSF.parse_date_code(dateString);
    if (excelDate) {
      date = new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
    }
  }

  if (isNaN(date.getTime())) {
    console.warn(`Invalid date value: "${dateString}"`);
    return null;
  }

  // Return ISO string
  return date.toISOString();
};

// Utility to format dates for display
export const formatDateForDisplay = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateForErrorMessage = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Utility to calculate duration in hours
export const calculateDuration = (timeFrom, timeTo) => {
  const parseTime = (timeString) => {
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes; // Convert to minutes
  };

  const fromMinutes = parseTime(timeFrom);
  const toMinutes = parseTime(timeTo);

  let durationMinutes = toMinutes - fromMinutes;
  if (durationMinutes < 0) durationMinutes += 24 * 60; // Add a day if it goes past midnight

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return { hours, minutes };
};

export const formatDurationForDisplay = (duration) => {
  const { hours, minutes } = duration;
  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
};


// Utility to format dates
// const formatDate = (dateString) => {
//   if (!dateString) {
//     console.warn("Empty date value provided.");
//     return null;
//   }

//   // First, try parsing as a regular date string
//   let date = new Date(dateString);

//   // If that fails, try parsing as an Excel serial number
//   if (isNaN(date.getTime())) {
//     const excelDate = XLSX.SSF.parse_date_code(dateString);
//     if (excelDate) {
//       date = new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
//     }
//   }

//   if (isNaN(date.getTime())) {
//     console.warn(`Invalid date value: "${dateString}"`);
//     return null;
//   }

//   // Return ISO string with time set to 00:00:00
//   return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
// };

export const importEventAndParticipants = async (file) => {
  try {
    const data = await readFile(file);

    // Extract event metadata from the structured rows
    const eventMetadata = extractEventMetadata(data);
    console.log("Extracted Event Metadata:", eventMetadata);
    validateEventMetadata(eventMetadata);

    // Extract participant details
    const participants = extractParticipants(data);
    console.log("Extracted Participants:", participants);
    validateParticipants(participants);

    // Check for duplicate event
    const isDuplicate = await checkForDuplicateEvent(eventMetadata);
    
    if (isDuplicate) {
      return {
        success: false,
        message: `Event "${eventMetadata.eventName}" on ${formatDateForErrorMessage(eventMetadata.eventDate)} at ${eventMetadata.eventVenue} already exists in the database. Skipped import.`,
      };
    }

    // Save event and participants to the database
    const eventResponse = await saveEventToDatabase(eventMetadata);
    const participantResponses = await saveParticipantsToDatabase(
      participants,
      eventResponse.$id // Link participants to the event
    );

    return {
      success: true,
      message: `Successfully imported ${participantResponses.length} participants for event: ${eventMetadata.eventName}.`,
    };
  } catch (error) {
    console.error("Error importing event and participants:", error);
    throw new Error(error.message || "Failed to import data.");
  }
};

export const readFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const binaryString = event.target?.result;
        if (typeof binaryString !== "string") {
          throw new Error("Failed to read file as binary string.");
        }
        const workbook = XLSX.read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log("Parsed Excel Data:", data);
        resolve(data);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        reject(
          new Error(
            "Failed to parse the file. Please ensure it is a valid Excel or CSV file."
          )
        );
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(new Error("Failed to read the file. Please try again."));
    };

    reader.readAsBinaryString(file);
  });
};

export const extractEventMetadata = (data) => {
  console.log("Raw Excel Data:", data);

  const getCellValue = (rowIndex, colIndex) => {
    const value = data[rowIndex]?.[colIndex];
    return value !== undefined ? String(value).trim() : null;
  };

  const eventTimeFrom = getCellValue(2, 5).split("-")[0].trim();
  const eventTimeTo = getCellValue(2, 5).split("-")[1].trim();
  const calculatedDuration = calculateDuration(eventTimeFrom, eventTimeTo);

  const metadata = {
    eventName: getCellValue(0, 1),
    eventDate: formatDateForDatabase(getCellValue(0, 5)),
    eventVenue: getCellValue(1, 1),
    eventType: getCellValue(1, 5),
    eventCategory: getCellValue(2, 1),
    eventTimeFrom: eventTimeFrom,
    eventTimeTo: eventTimeTo,
    numberOfHours: calculatedDuration.hours,
    numberOfMinutes: calculatedDuration.minutes
  };

  console.log("Extracted Event Metadata:", metadata);
  return metadata;
};

const validateEventMetadata = (eventMetadata) => {
  console.log("Validating Event Metadata:", eventMetadata);

  if (!eventMetadata.eventName) {
    throw new Error("Event Name is missing.");
  }
  if (!eventMetadata.eventDate) {
    throw new Error("Invalid or missing Event Date.");
  }
  if (!eventMetadata.eventVenue) {
    throw new Error("Event Venue is missing.");
  }
  if (typeof eventMetadata.numberOfHours !== 'number' || eventMetadata.numberOfHours < 0 ||
      typeof eventMetadata.numberOfMinutes !== 'number' || eventMetadata.numberOfMinutes < 0 || eventMetadata.numberOfMinutes >= 60) {
    throw new Error("Invalid duration. Please check the event start and end times.");
  }
};


export const extractParticipants = (data) => {
  console.log("Searching for participant data...");

  const participantHeaderIndex = data.findIndex(
    (row) => row[0] === "Name" && row[1] === "StudentId" && row[2] === "Sex"
  );

  if (participantHeaderIndex === -1) {
    console.warn(
      "Participant data header not found. Unable to extract participants."
    );
    throw new Error("Unable to locate participant data in the file.");
  }

  console.log(`Participant data header found at row ${participantHeaderIndex}`);
  return extractParticipantsFromRow(data, participantHeaderIndex + 1);
};

const extractParticipantsFromRow = (data, startRow) => {
  return data
    .slice(startRow)
    .map((row) => ({
      name: row[0] || null,
      studentId: row[1] || null,
      sex: row[2] || null,
      age: parseInt(row[3], 10) || null,
      school: row[4] || null,
      year: row[5] || null,
      section: row[6] || null,
      ethnicGroup: row[7] || null,
    }))
    .filter((participant) => participant.name && participant.studentId);
};

const validateParticipants = (participants) => {
  participants.forEach((participant, index) => {
    if (!participant.name) {
      throw new Error(`Participant at row ${index + 1} is missing a Name.`);
    }
    if (!participant.studentId) {
      throw new Error(
        `Participant at row ${index + 1} is missing a Student ID.`
      );
    }
    if (!["Male", "Female"].includes(participant.sex)) {
      throw new Error(
        `Participant at row ${index + 1} has an invalid Sex value.`
      );
    }
  });
};

const checkForDuplicateEvent = async (eventMetadata) => {
  try {
    const response = await databases.listDocuments(
      databaseId,
      eventCollectionId,
      [
        Query.equal('eventName', eventMetadata.eventName),
        Query.equal('eventDate', eventMetadata.eventDate),
        Query.equal('eventVenue', eventMetadata.eventVenue)
      ]
    );

    return response.documents.length > 0;
  } catch (error) {
    console.error("Error checking for duplicate event:", error);
    throw new Error("Failed to check for duplicate event: " + error.message);
  }
};

const saveEventToDatabase = async (eventMetadata) => {
  try {
    const isDuplicate = await checkForDuplicateEvent(eventMetadata);
    if (isDuplicate) {
      console.log("Duplicate event found:", eventMetadata);
      return { isDuplicate: true, eventMetadata };
    }

    const response = await databases.createDocument(
      databaseId,
      eventCollectionId,
      ID.unique(),
      eventMetadata
    );
    console.log("Event saved successfully:", response);
    return { isDuplicate: false, response };
  } catch (error) {
    console.error("Error saving event to database:", error);
    throw new Error("Failed to save event to database: " + error.message);
  }
};

