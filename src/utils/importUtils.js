import * as XLSX from "xlsx";
import { ID, Query } from "appwrite";
import {
  databases,
  databaseId,
  eventCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
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

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid time format");
    }

    // Get time values in milliseconds since midnight
    const startMs = (start.getHours() * 60 + start.getMinutes()) * 60 * 1000;
    const endMs = (end.getHours() * 60 + end.getMinutes()) * 60 * 1000;

    // Calculate duration
    let durationMs = endMs - startMs;

    // Handle case where end time is on the next day
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    console.log("Duration calculation:", {
      start: start.toLocaleTimeString(),
      end: end.toLocaleTimeString(),
      durationMs,
      hours,
      minutes,
    });

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

// Function to create participants in their respective collections
const createParticipants = async (
  participants,
  collectionId,
  type,
  eventId,
  academicPeriodId,
  currentUser
) => {
  console.log(`Starting creation of ${type} participants:`, {
    count: participants.length,
    collectionId,
    eventId,
    type,
  });

  const createdParticipants = [];
  for (const participant of participants) {
    try {
      const participantId = ID.unique();

      // Base participant data
      let participantData = {
        name: participant.name,
        sex: participant.sex,
        age: parseInt(participant.age) || 0,
        ethnicGroup: participant.ethnicGroup || "",
        otherEthnicGroup: participant.otherEthnicGroup || "",
        eventId: eventId,
        academicPeriodId: academicPeriodId,
        createdBy: currentUser.$id,
        isArchived: false,
        participantType: type,
        address: participant.address || participant.homeAddress || "N/A",
      };

      // Add type-specific fields
      if (type === "student") {
        participantData = {
          ...participantData,
          studentId: participant.studentId,
          school: participant.school || "",
          year: participant.year || "",
          section: participant.section || "",
        };
      } else if (type === "staff") {
        participantData = {
          ...participantData,
          staffFacultyId: participant.staffFacultyId || "",
        };
      }

      console.log(`Creating ${type} participant with data:`, participantData);

      const createdParticipant = await databases.createDocument(
        databaseId,
        collectionId,
        participantId,
        participantData
      );

      console.log(
        `Successfully created ${type} participant:`,
        createdParticipant
      );
      createdParticipants.push(participantId);
    } catch (error) {
      console.error(`Error creating ${type} participant:`, error);
      throw error;
    }
  }

  return createdParticipants;
};

// Update the extraction functions to match Excel format exactly
export const extractParticipants = (excelData) => {
  const participants = [];
  for (let i = 9; i < excelData.length; i++) {
    const row = excelData[i];
    if (row && row[0] && row[1]) {
      participants.push({
        name: row[0],
        studentId: row[1],
        sex: row[2]?.split(" ")[0],
        age: parseInt(row[3]) || 0,
        address: row[4] || "N/A", // Changed from homeAddress to address
        school: row[5] || "",
        year: row[6] || "",
        section: row[7] || "",
        ethnicGroup: row[8] || "",
      });
    }
  }
  return participants.filter((p) => p.name && p.name !== "N/A");
};

export const extractStaffFaculty = (excelData) => {
  console.log("Starting staff/faculty extraction...");
  const staffFaculty = [];

  for (let i = 9; i < excelData.length; i++) {
    const row = excelData[i];
    if (row && row[10] && row[11]) {
      const staffMember = {
        name: row[10],
        staffFacultyId: row[11],
        sex: row[12]?.split(" ")[0] || "N/A",
        age: parseInt(row[13]) || 0,
        address: row[14] || "N/A", // Ensure address is never empty
        ethnicGroup: row[15] || "N/A",
        otherEthnicGroup: "",
      };

      console.log("Found staff/faculty:", staffMember);
      staffFaculty.push(staffMember);
    }
  }

  return staffFaculty;
};

export const extractCommunityMembers = (excelData) => {
  console.log("Starting community members extraction...");
  const community = [];

  for (let i = 9; i < excelData.length; i++) {
    const row = excelData[i];
    if (row && row[17] && row[18]) {
      const communityMember = {
        name: row[17],
        sex: row[18]?.split(" ")[0] || "N/A",
        age: parseInt(row[19]) || 0,
        address: row[20] || "N/A", // Ensure address is never empty
        ethnicGroup: row[21] || "N/A",
        otherEthnicGroup: "",
      };

      console.log("Found community member:", communityMember);
      community.push(communityMember);
    }
  }

  return community;
};

// Update the formatEventData function
const formatEventData = (rawData) => {
  console.log('Raw event data:', rawData);
  console.log('Raw numberOfHours:', rawData.numberOfHours);
  console.log('Type of numberOfHours:', typeof rawData.numberOfHours);

  // Calculate duration from time range
  let numberOfHours = '';
  try {
    console.log('Calculating duration from time range');
    
    // Extract time portions from the ISO strings
    const timeFrom = rawData.eventTimeFrom.split('T')[1].split('.')[0];
    const timeTo = rawData.eventTimeTo.split('T')[1].split('.')[0];
    
    console.log('Time From:', timeFrom);
    console.log('Time To:', timeTo);
    
    // Create Date objects for today with the extracted times
    const startTime = new Date(`2000-01-01T${timeFrom}`);
    const endTime = new Date(`2000-01-01T${timeTo}`);
    
    // Handle case where end time is on next day (e.g., event ends after midnight)
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    console.log('Start Time:', startTime);
    console.log('End Time:', endTime);
    
    const diffHours = (endTime - startTime) / (1000 * 60 * 60);
    const hours = Math.floor(diffHours);
    const minutes = Math.round((diffHours - hours) * 60);
    
    console.log('Calculated diff hours:', diffHours);
    console.log('Final hours:', hours);
    console.log('Final minutes:', minutes);
    
    numberOfHours = `${hours} hours ${minutes} minutes`;
  } catch (error) {
    console.error('Error calculating duration:', error);
    numberOfHours = '0 hours 0 minutes';
  }

  console.log('Final formatted numberOfHours:', numberOfHours);

  const formattedData = {
    ...rawData,
    numberOfHours
  };

  console.log('Final formatted event data:', formattedData);
  return formattedData;
};

// Update the importEventAndParticipants function
export const importEventAndParticipants = async (file, academicPeriodId) => {
  try {
    const data = await handleFileChange(file);
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    const eventData = formatEventData(data.eventMetadata);

    // Ensure numberOfHours is properly formatted before saving
    if (!eventData.numberOfHours || eventData.numberOfHours.includes('NaN')) {
      eventData.numberOfHours = '0 hours 0 minutes';
    }

    // Create event with academicPeriodId
    const eventId = ID.unique();
    const eventDataToSave = {
      eventName: eventData.eventName,
      eventDate: eventData.eventDate,
      eventTimeFrom: eventData.eventTimeFrom,
      eventTimeTo: eventData.eventTimeTo,
      eventVenue: eventData.eventVenue,
      eventType: eventData.eventType,
      eventCategory: eventData.eventCategory,
      numberOfHours: eventData.numberOfHours,
      participants: [],
      createdBy: currentUser.$id,
      showOnHomepage: false,
      isArchived: false,
      academicPeriodId: academicPeriodId, // Make sure this is set
      archivedAt: '',
      createdAt: new Date().toISOString(),
      source: 'imported'
    };

    // Create participants first to get their IDs
    const participantIds = [];

    // Create student participants
    for (const participant of data.participants) {
      const participantId = ID.unique();
      const participantData = {
        name: participant.name,
        studentId: participant.studentId,
        sex: participant.sex,
        age: parseInt(participant.age) || 0,
        address: participant.address || "N/A",
        school: participant.school || "",
        year: participant.year || "",
        section: participant.section || "",
        ethnicGroup: participant.ethnicGroup || "",
        eventId: eventId,
        academicPeriodId: academicPeriodId,
        createdBy: currentUser.$id,
        isArchived: false,
        participantType: "student",
      };

      await databases.createDocument(
        databaseId,
        participantCollectionId,
        participantId,
        participantData
      );

      participantIds.push(`student_${participantId}`);
    }

    // Create staff/faculty participants
    for (const staff of data.staffFaculty) {
      const staffId = ID.unique();
      const staffData = {
        name: staff.name,
        staffFacultyId: staff.staffFacultyId || "",
        sex: staff.sex,
        age: parseInt(staff.age) || 0,
        address: staff.address || "N/A",
        ethnicGroup: staff.ethnicGroup || "",
        eventId: eventId,
        academicPeriodId: academicPeriodId,
        createdBy: currentUser.$id,
        isArchived: false,
        participantType: "staff",
      };

      await databases.createDocument(
        databaseId,
        staffFacultyCollectionId,
        staffId,
        staffData
      );

      participantIds.push(`staff_${staffId}`);
    }

    // Create community participants
    for (const member of data.community) {
      const memberId = ID.unique();
      const memberData = {
        name: member.name,
        sex: member.sex,
        age: parseInt(member.age) || 0,
        address: member.address || "N/A",
        ethnicGroup: member.ethnicGroup || "",
        eventId: eventId,
        academicPeriodId: academicPeriodId,
        createdBy: currentUser.$id,
        isArchived: false,
        participantType: "community",
      };

      await databases.createDocument(
        databaseId,
        communityCollectionId,
        memberId,
        memberData
      );

      participantIds.push(`community_${memberId}`);
    }

    // Update event data with participant IDs array
    eventData.participants = participantIds;

    // Create the event with all participants
    const createdEvent = await databases.createDocument(
      databaseId,
      eventCollectionId,
      eventId,
      eventDataToSave
    );

    return {
      success: true,
      message: `Successfully imported event "${data.eventMetadata.eventName}" with ${participantIds.length} participants`,
      event: createdEvent,
      participantCounts: {
        total: participantIds.length,
        students: data.participants.length,
        staffFaculty: data.staffFaculty.length,
        community: data.community.length,
      },
    };
  } catch (error) {
    console.error("Import error:", error);
    throw error;
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

// Update the parseTimeAndSetDate function to handle timezones correctly
const parseTimeAndSetDate = (timeString, dateObj) => {
  try {
    timeString = timeString.trim();
    const [time, period] = timeString.split(/\s+/);

    if (!time || !period) {
      throw new Error(
        `Invalid time format: ${timeString}. Expected format: HH:MM AM/PM`
      );
    }

    const [hours, minutes] = time.split(":").map((num) => parseInt(num, 10));

    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time values in: ${timeString}`);
    }

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time values: Hours must be 1-12, minutes 0-59`);
    }

    const newDate = new Date(dateObj);
    let adjustedHours = hours;

    if (period.toUpperCase() === "PM" && hours !== 12) {
      adjustedHours += 12;
    } else if (period.toUpperCase() === "AM" && hours === 12) {
      adjustedHours = 0;
    }

    newDate.setHours(adjustedHours, minutes, 0, 0);

    console.log(`Parsed time ${timeString} to:`, {
      original: newDate.toISOString(),
      localTime: newDate.toLocaleTimeString(),
      hours: adjustedHours,
      minutes,
    });

    return newDate;
  } catch (error) {
    throw new Error(`Error parsing time "${timeString}": ${error.message}`);
  }
};

// Update the extractEventMetadata function
export const extractEventMetadata = (data) => {
  console.log("Raw Excel Data:", data);

  if (!Array.isArray(data) || data.length < 5) {
    throw new Error(
      "Invalid file format: File must contain at least 5 rows of data"
    );
  }

  const getCellValue = (rowIndex, colIndex) => {
    const row = data[rowIndex];
    if (!row) {
      throw new Error(`Missing required row ${rowIndex + 1}`);
    }
    const value = row[colIndex];
    if (value === undefined || value === null || value === "") {
      throw new Error(
        `Missing required value at row ${rowIndex + 1}, column ${colIndex + 1}`
      );
    }
    return String(value).trim();
  };

  try {
    // Extract and validate each field
    const eventName = getCellValue(2, 1);
    const eventVenue = getCellValue(3, 1);
    const eventType = getCellValue(1, 5);
    const eventCategory = getCellValue(4, 1);
    const rawEventDate = getCellValue(0, 5);

    // Get and validate the time range
    const timeRange = getCellValue(2, 5);
    console.log("Time range from Excel:", timeRange);

    if (!timeRange || !timeRange.includes("-")) {
      throw new Error(
        "Invalid time range format. Expected format: HH:MM AM/PM - HH:MM AM/PM"
      );
    }

    // Split and trim the time range
    const [eventTimeFrom, eventTimeTo] = timeRange
      .split("-")
      .map((t) => t.trim());

    // Parse the date
    const eventDate = formatDateForDatabase(rawEventDate);
    if (!eventDate) {
      throw new Error(`Invalid date format: ${rawEventDate}`);
    }

    // Parse times and calculate duration
    const fromDateTime = parseTimeAndSetDate(
      eventTimeFrom,
      new Date(eventDate)
    );
    const toDateTime = parseTimeAndSetDate(eventTimeTo, new Date(eventDate));
    const duration = calculateDuration(fromDateTime, toDateTime);

    const metadata = {
      eventName,
      eventDate,
      eventTimeFrom: fromDateTime.toISOString(),
      eventTimeTo: toDateTime.toISOString(),
      eventVenue,
      eventType,
      eventCategory,
      numberOfHours: String(duration.hours),
    };

    // Validate all required fields
    Object.entries(metadata).forEach(([key, value]) => {
      if (!value) {
        throw new Error(`Missing required field: ${key}`);
      }
    });

    console.log("Extracted metadata:", metadata);
    return metadata;
  } catch (error) {
    console.error("Error extracting event metadata:", error);
    throw new Error(`Failed to extract event data: ${error.message}`);
  }
};

// Update the validateEventMetadata function to validate new fields
const validateEventMetadata = (eventMetadata) => {
  // Add validation for new fields
  if (!eventMetadata.schoolYear) {
    throw new Error("School year is required");
  }
  if (!eventMetadata.periodType) {
    throw new Error("Period type is required");
  }

  // Basic field validation
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

  try {
    // Parse the times
    const startTime = new Date(eventMetadata.eventTimeFrom);
    const endTime = new Date(eventMetadata.eventTimeTo);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error("Invalid event time format");
    }

    // Get time values in milliseconds since midnight
    const startMs =
      (startTime.getHours() * 60 + startTime.getMinutes()) * 60 * 1000;
    const endMs = (endTime.getHours() * 60 + endTime.getMinutes()) * 60 * 1000;

    // Calculate duration
    let durationMs = endMs - startMs;

    // Handle case where end time is on the next day
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }

    // Calculate hours and store in metadata
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    eventMetadata.numberOfHours = String(hours);

    console.log("Time validation:", {
      startTime: startTime.toLocaleTimeString(),
      endTime: endTime.toLocaleTimeString(),
      durationMs,
      hours,
    });

    return eventMetadata;
  } catch (error) {
    console.error("Error validating event times:", error);
    throw new Error(`Invalid event times: ${error.message}`);
  }
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

// Update the checkForDuplicateEvent function
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

// Add formatTime function
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, " "); // Ensure consistent spacing
};

// Update the formatEventPreview function
export const formatEventPreview = (data) => {
  console.log("Formatting preview data:", data);

  return {
    schoolYear: data.schoolYear,
    periodType: data.periodType,
    eventName: data.eventMetadata.eventName,
    eventDate: formatDateForDisplay(data.eventMetadata.eventDate),
    eventTime: `${formatTime(data.eventMetadata.eventTimeFrom)} - ${formatTime(
      data.eventMetadata.eventTimeTo
    )}`,
    duration: calculateDuration(
      data.eventMetadata.eventTimeFrom,
      data.eventMetadata.eventTimeTo
    ).toString(),
    eventVenue: data.eventMetadata.eventVenue,
    eventType: data.eventMetadata.eventType,
    eventCategory: data.eventMetadata.eventCategory,
    totalParticipants: data.totalParticipants,
    participantDetails: {
      male: data.participantDetails.male,
      female: data.participantDetails.female,
      students: data.participantDetails.students,
      staffFaculty: data.participantDetails.staffFaculty,
      community: data.participantDetails.community,
    },
  };
};

// Update the handleFileChange function
export const handleFileChange = async (file) => {
  try {
    const excelData = await readFile(file);

    const eventMetadata = extractEventMetadata(excelData);
    const participants = extractParticipants(excelData);
    const staffFaculty = extractStaffFaculty(excelData);
    const community = extractCommunityMembers(excelData);

    // Get the counts from specific cells in the Excel file
    const totalParticipants = parseInt(excelData[3][5]) || 0;
    const totalMale = parseInt(excelData[4][5]) || 0;
    const totalFemale = parseInt(excelData[5][5]) || 0;
    const studentCount = parseInt(excelData[0][8]) || 0;
    const staffFacultyCount = parseInt(excelData[1][8]) || 0;
    const communityCount = parseInt(excelData[2][8]) || 0;

    // Get school year and period type
    const schoolYear = excelData[0][1];
    const periodType = excelData[1][1];

    return {
      eventMetadata,
      excelData,
      schoolYear,
      periodType,
      totalParticipants,
      participantDetails: {
        male: totalMale,
        female: totalFemale,
        students: studentCount,
        staffFaculty: staffFacultyCount,
        community: communityCount,
      },
      participants,
      staffFaculty,
      community,
    };
  } catch (error) {
    throw error;
  }
};
