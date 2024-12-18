import * as XLSX from "xlsx";
import { ID, Query } from "appwrite";
import {
  databases,
  databaseId,
  eventCollectionId,
  participantCollectionId,
  getCurrentUser,
} from "@/lib/appwrite";

// Utility to format dates for database storage
export const formatDateForDatabase = (dateString) => {
  if (!dateString) {
    throw new Error("Empty date value provided");
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
    throw new Error(`Invalid date value: "${dateString}"`);
  }

  // Set time to midnight UTC to avoid timezone issues
  date.setUTCHours(0, 0, 0, 0);
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
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Utility to calculate duration in hours
export const calculateDuration = (timeFrom, timeTo) => {
  try {
    const start = new Date(timeFrom);
    const end = new Date(timeTo);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid time format");
    }

    const durationMs = end - start;
    if (durationMs < 0) {
      throw new Error("End time must be after start time");
    }

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      hours,
      minutes,
      toString: () =>
        `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${
          minutes !== 1 ? "s" : ""
        }`,
    };
  } catch (error) {
    console.error("Error calculating duration:", error);
    throw new Error(
      "Invalid duration. Please check the event start and end times."
    );
  }
};

export const formatDurationForDisplay = (duration) => {
  const { hours, minutes } = duration;
  return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${
    minutes !== 1 ? "s" : ""
  }`;
};

// Utility to format dates
const formatDate = (dateString) => {
  if (!dateString) {
    console.warn("Empty date value provided.");
    return null;
  }

  //   // First, try parsing as a regular date string
  let date = new Date(dateString);

  //   // If that fails, try parsing as an Excel serial number
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

  // Return ISO string with time set to 00:00:00
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ).toISOString();
};

export const importEventAndParticipants = async (file) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("You must be logged in to import events");
    }

    const data = await readFile(file);
    const eventMetadata = extractEventMetadata(data);
    console.log("Extracted Event Metadata:", eventMetadata);
    validateEventMetadata(eventMetadata);

    const participants = extractParticipants(data);
    console.log("Extracted Participants:", participants);
    validateParticipants(participants);

    const isDuplicate = await checkForDuplicateEvent(eventMetadata);

    if (isDuplicate) {
      return {
        success: false,
        message: `Event "${
          eventMetadata.eventName
        }" on ${formatDateForErrorMessage(eventMetadata.eventDate)} at ${
          eventMetadata.eventVenue
        } already exists in the database. Skipped import.`,
      };
    }

    const eventResponse = await saveEventToDatabase(eventMetadata);
    const participantResponses = await saveParticipantsToDatabase(
      participants,
      eventResponse.response.$id
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

  try {
    // Get and validate the event date first
    const rawEventDate = getCellValue(0, 5);
    if (!rawEventDate) {
      throw new Error("Event date is missing");
    }

    // Parse the event date
    const eventDate = formatDateForDatabase(rawEventDate);
    if (!eventDate) {
      throw new Error("Invalid event date format");
    }

    // Get and validate the time range
    const timeRange = getCellValue(2, 5);
    if (!timeRange || !timeRange.includes("-")) {
      throw new Error(
        "Invalid time range format. Expected format: HH:MM AM/PM - HH:MM AM/PM"
      );
    }

    const [eventTimeFrom, eventTimeTo] = timeRange
      .split("-")
      .map((t) => t.trim());

    // Create date objects for the time values
    const timeFromDate = new Date(eventDate);
    const timeToDate = new Date(eventDate);

    // Parse the start time
    const parseTimeAndSetDate = (timeString, dateObj) => {
      const [time, period] = timeString.split(" ");
      if (!time || !period) {
        throw new Error(
          `Invalid time format: ${timeString}. Expected format: HH:MM AM/PM`
        );
      }

      const [hours, minutes] = time.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error(`Invalid time values: ${timeString}`);
      }

      let adjustedHours = hours;
      if (period === "PM" && hours !== 12) adjustedHours += 12;
      if (period === "AM" && hours === 12) adjustedHours = 0;

      dateObj.setHours(adjustedHours, minutes, 0, 0);
      return dateObj;
    };

    // Set the times
    const fromDateTime = parseTimeAndSetDate(eventTimeFrom, timeFromDate);
    const toDateTime = parseTimeAndSetDate(eventTimeTo, timeToDate);

    // Calculate duration and validate
    const duration = calculateDuration(fromDateTime, toDateTime);
    if (!duration || duration.hours < 0) {
      throw new Error("Invalid duration calculated");
    }

    // Create metadata object matching exact schema
    const metadata = {
      eventName: getCellValue(0, 1),
      eventDate: eventDate,
      eventTimeFrom: fromDateTime.toISOString(),
      eventTimeTo: toDateTime.toISOString(),
      eventVenue: getCellValue(1, 1),
      eventType: getCellValue(1, 5),
      eventCategory: getCellValue(2, 1),
      numberOfHours: String(duration.hours), // Convert to string
      participants: [], // Initialize empty array
      createdBy: "", // This will be set in saveEventToDatabase
    };

    return metadata;
  } catch (error) {
    console.error("Error extracting event metadata:", error);
    throw new Error(`Failed to extract event data: ${error.message}`);
  }
};

const validateEventMetadata = (eventMetadata) => {
  if (!eventMetadata.eventName) {
    throw new Error("Event name is required");
  }
  if (!eventMetadata.eventDate) {
    throw new Error("Event date is required");
  }
  if (!eventMetadata.eventTimeFrom || !eventMetadata.eventTimeTo) {
    throw new Error("Event start and end times are required");
  }
  if (!eventMetadata.eventVenue) {
    throw new Error("Event venue is required");
  }
  if (!eventMetadata.eventType) {
    throw new Error("Event type is required");
  }
  if (!eventMetadata.eventCategory) {
    throw new Error("Event category is required");
  }

  // Validate time range
  const startTime = new Date(eventMetadata.eventTimeFrom);
  const endTime = new Date(eventMetadata.eventTimeTo);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error("Invalid event time format");
  }

  if (endTime <= startTime) {
    throw new Error("Event end time must be after start time");
  }

  // Calculate duration in hours
  const durationMs = endTime - startTime;
  const durationHours = durationMs / (1000 * 60 * 60);

  // Convert duration to string and store in numberOfHours
  eventMetadata.numberOfHours = String(Math.floor(durationHours));

  return eventMetadata;
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
        Query.equal("eventName", eventMetadata.eventName),
        Query.equal("eventDate", eventMetadata.eventDate),
        Query.equal("eventVenue", eventMetadata.eventVenue),
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

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    const eventData = {
      ...eventMetadata,
      createdBy: currentUser.$id,
    };

    const response = await databases.createDocument(
      databaseId,
      eventCollectionId,
      ID.unique(),
      eventData
    );

    console.log("Event saved successfully:", response);
    return { isDuplicate: false, response };
  } catch (error) {
    console.error("Error saving event to database:", error);
    throw new Error("Failed to save event to database: " + error.message);
  }
};

const saveParticipantsToDatabase = async (participants, eventId) => {
  try {
    const participantPromises = participants.map(async (participant) => {
      const participantData = {
        name: participant.name,
        studentId: participant.studentId,
        sex: participant.sex,
        age: participant.age || "",
        school: participant.school || "",
        year: participant.year || "",
        section: participant.section || "",
        ethnicGroup: participant.ethnicGroup || "",
        eventId: eventId,
        createdBy: "", // Will be set by getCurrentUser
      };

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }

      participantData.createdBy = currentUser.$id;

      return databases.createDocument(
        databaseId,
        participantCollectionId,
        ID.unique(),
        participantData
      );
    });

    const responses = await Promise.all(participantPromises);
    console.log("Participants saved successfully:", responses);
    return responses;
  } catch (error) {
    console.error("Error saving participants to database:", error);
    throw new Error(
      "Failed to save participants to database: " + error.message
    );
  }
};
