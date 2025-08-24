import * as XLSX from "xlsx";
import { addDoc, collection, query, where, getDocs, db, COLLECTIONS, getCurrentUser, getCurrentAcademicPeriod } from "@/lib/firebase";


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

      const createdParticipant = await db.createDocument(
        COLLECTIONS,
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
  console.log("Raw event data:", rawData);
  console.log("Raw numberOfHours:", rawData.numberOfHours);
  console.log("Type of numberOfHours:", typeof rawData.numberOfHours);

  // Calculate duration from time range
  let numberOfHours = "";
  try {
    console.log("Calculating duration from time range");

    // Extract time portions from the ISO strings
    const timeFrom = rawData.eventTimeFrom.split("T")[1].split(".")[0];
    const timeTo = rawData.eventTimeTo.split("T")[1].split(".")[0];

    console.log("Time From:", timeFrom);
    console.log("Time To:", timeTo);

    // Create Date objects for today with the extracted times
    const startTime = new Date(`2000-01-01T${timeFrom}`);
    const endTime = new Date(`2000-01-01T${timeTo}`);

    // Handle case where end time is on next day (e.g., event ends after midnight)
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    console.log("Start Time:", startTime);
    console.log("End Time:", endTime);

    const diffHours = (endTime - startTime) / (1000 * 60 * 60);
    const hours = Math.floor(diffHours);
    const minutes = Math.round((diffHours - hours) * 60);

    console.log("Calculated diff hours:", diffHours);
    console.log("Final hours:", hours);
    console.log("Final minutes:", minutes);

    numberOfHours = `${hours} hours ${minutes} minutes`;
  } catch (error) {
    console.error("Error calculating duration:", error);
    numberOfHours = "0 hours 0 minutes";
  }

  console.log("Final formatted numberOfHours:", numberOfHours);

  const formattedData = {
    ...rawData,
    numberOfHours,
  };

  console.log("Final formatted event data:", formattedData);
  return formattedData;
};

// New function to import events from CSV
export const importEventsFromCSV = async (events, academicPeriodId) => {
  try {
    const currentUser = await getCurrentUser();
    
    // Get the current academic period if not provided
    let currentAcademicPeriodId = academicPeriodId;
    if (!currentAcademicPeriodId || currentAcademicPeriodId === "current_period_id") {
      const currentPeriod = await getCurrentAcademicPeriod();
      if (!currentPeriod) {
        throw new Error("No active academic period found. Please create an academic period first.");
      }
      currentAcademicPeriodId = currentPeriod.id;
    }
    
    const results = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
      events: []
    };

    for (const eventData of events) {
      try {
        // Check for duplicate event
        const duplicateCheck = await checkForDuplicateEvent({
          eventName: eventData.eventName,
          eventDate: eventData.eventDate,
          eventVenue: eventData.eventVenue, // Use the mapped field name
        });

        if (duplicateCheck.isDuplicate) {
          results.failed++;
          results.errors.push(`Event "${eventData.eventName}" already exists (same name, date, and venue)`);
          continue;
        }

        // Create the event using Firebase
        const eventDataToSave = {
          eventName: eventData.eventName,
          eventDate: eventData.eventDate,
          eventTimeFrom: eventData.eventTimeFrom,
          eventTimeTo: eventData.eventTimeTo,
          eventVenue: eventData.eventVenue, // Use the mapped field name
          eventDescription: eventData.eventDescription,
          eventType: eventData.eventType,
          maxParticipants: eventData.maxParticipants,
          registrationDeadline: eventData.registrationDeadline,
          eventStatus: eventData.eventStatus,
          organizerName: eventData.organizerName,
          contactEmail: eventData.contactEmail,
          contactPhone: eventData.contactPhone,
          numberOfHours: eventData.numberOfHours,
          participants: [], // CSV doesn't include participant data
          createdBy: currentUser.$id,
          showOnHomepage: false,
          isArchived: eventData.isArchived,
          academicPeriodId: currentAcademicPeriodId,
          archivedAt: "",
          createdAt: new Date().toISOString(),
          source: "imported_csv",
        };

        const eventsRef = collection(db, COLLECTIONS.EVENTS);
        const docRef = await addDoc(eventsRef, eventDataToSave);
        const createdEvent = { id: docRef.id, ...eventDataToSave };

        results.imported++;
        results.events.push(createdEvent);
      } catch (error) {
        console.error(`Error importing event "${eventData.eventName}":`, error);
        results.failed++;
        results.errors.push(`Event "${eventData.eventName}": ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    console.error("Error importing events from CSV:", error);
    throw error;
  }
};

// Update the existing importEventAndParticipants function to handle CSV
export const importEventAndParticipants = async (file, academicPeriodId) => {
  try {
    const data = await handleFileChange(file);

    if (data.fileType === 'csv') {
      // Handle CSV import
      const results = await importEventsFromCSV(data.allEvents, academicPeriodId);
      
      if (results.imported > 0) {
        return {
          success: true,
          message: `Successfully imported ${results.imported} events from CSV${results.failed > 0 ? ` (${results.failed} failed)` : ''}`,
          importedCount: results.imported,
          failedCount: results.failed,
          errors: results.errors,
          events: results.events,
        };
      } else {
        throw new Error(`Failed to import any events. Errors: ${results.errors.join(', ')}`);
      }
    } else {
             // Handle Excel import (existing logic)
       const currentUser = await getCurrentUser();
       const participantIds = [];

       // Create student participants
       for (const participant of data.participants) {
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
           academicPeriodId: academicPeriodId,
           createdBy: currentUser.$id,
           isArchived: false,
           participantType: "student",
         };

         const studentsRef = collection(db, COLLECTIONS.STUDENTS);
         const docRef = await addDoc(studentsRef, participantData);
         participantIds.push(`student_${docRef.id}`);
       }

             // Create staff/faculty participants
       for (const staff of data.staffFaculty) {
         const staffData = {
           name: staff.name,
           staffFacultyId: staff.staffFacultyId || "",
           sex: staff.sex,
           age: parseInt(staff.age) || 0,
           address: staff.address || "N/A",
           ethnicGroup: staff.ethnicGroup || "",
           academicPeriodId: academicPeriodId,
           createdBy: currentUser.$id,
           isArchived: false,
           participantType: "staff",
         };

         const staffRef = collection(db, COLLECTIONS.STAFF_FACULTY);
         const docRef = await addDoc(staffRef, staffData);
         participantIds.push(`staff_${docRef.id}`);
       }

             // Create community participants
       for (const member of data.community) {
         const memberData = {
           name: member.name,
           sex: member.sex,
           age: parseInt(member.age) || 0,
           address: member.address || "N/A",
           ethnicGroup: member.ethnicGroup || "",
           academicPeriodId: academicPeriodId,
           createdBy: currentUser.$id,
           isArchived: false,
           participantType: "community",
         };

         const communityRef = collection(db, COLLECTIONS.COMMUNITY);
         const docRef = await addDoc(communityRef, memberData);
         participantIds.push(`community_${docRef.id}`);
       }

             // Create the event with the formatted participant IDs
       const eventDataToSave = {
         eventName: data.eventMetadata.eventName,
         eventDate: data.eventMetadata.eventDate,
         eventTimeFrom: data.eventMetadata.eventTimeFrom,
         eventTimeTo: data.eventMetadata.eventTimeTo,
         eventVenue: data.eventMetadata.eventVenue,
         eventType: data.eventMetadata.eventType,
         eventCategory: data.eventMetadata.eventCategory,
         numberOfHours: data.eventMetadata.numberOfHours,
         participants: participantIds, // Array of formatted participant IDs
         createdBy: currentUser.$id,
         showOnHomepage: false,
         isArchived: false,
         academicPeriodId: academicPeriodId,
         archivedAt: "",
         createdAt: new Date().toISOString(),
         source: "imported",
       };

       const eventsRef = collection(db, COLLECTIONS.EVENTS);
       const docRef = await addDoc(eventsRef, eventDataToSave);
       const createdEvent = { id: docRef.id, ...eventDataToSave };

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
    }
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

// Enhanced parseTimeAndSetDate function to handle multiple time formats
const parseTimeAndSetDate = (timeString, dateObj) => {
  try {
    timeString = timeString.trim();
    
    // Remove extra spaces and normalize
    timeString = timeString.replace(/\s+/g, ' ');
    
    // Try different time format patterns
    let hours, minutes, period;
    
    // Pattern 1: HH:MM AM/PM (12-hour format)
    const pattern12Hour = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/;
    const match12Hour = timeString.match(pattern12Hour);
    
    if (match12Hour) {
      hours = parseInt(match12Hour[1], 10);
      minutes = parseInt(match12Hour[2], 10);
      period = match12Hour[3].toUpperCase();
    } else {
           // Pattern 2: HH:MM (24-hour format)
     const pattern24Hour = /^(\d{1,2}):(\d{2})$/;
     const match24Hour = timeString.match(pattern24Hour);
     
     if (match24Hour) {
       hours = parseInt(match24Hour[1], 10);
       minutes = parseInt(match24Hour[2], 10);
       // For 24-hour format, don't set period - we'll handle it differently
       period = null; // This indicates 24-hour format
     } else {
        // Pattern 3: H:MM AM/PM (single digit hour)
        const patternSingleHour = /^(\d):(\d{2})\s*(AM|PM|am|pm)$/;
        const matchSingleHour = timeString.match(patternSingleHour);
        
        if (matchSingleHour) {
          hours = parseInt(matchSingleHour[1], 10);
          minutes = parseInt(matchSingleHour[2], 10);
          period = matchSingleHour[3].toUpperCase();
        } else {
                     // Pattern 4: HH.MM AM/PM (dot separator)
           const patternDot = /^(\d{1,2})\.(\d{2})\s*(AM|PM|am|pm)$/;
           const matchDot = timeString.match(patternDot);
           
           if (matchDot) {
             hours = parseInt(matchDot[1], 10);
             minutes = parseInt(matchDot[2], 10);
             period = matchDot[3].toUpperCase();
             
             // Handle case where hours > 12 in dot format (e.g., "15.30 PM" should be "3.30 PM")
             if (hours > 12 && (period === 'AM' || period === 'PM')) {
               hours = hours - 12;
             }
           } else {
                         // Pattern 5: HHMM (military time)
             const patternMilitary = /^(\d{3,4})$/;
             const matchMilitary = timeString.match(patternMilitary);
             
             if (matchMilitary) {
               const timeStr = matchMilitary[1].padStart(4, '0');
               hours = parseInt(timeStr.substring(0, 2), 10);
               minutes = parseInt(timeStr.substring(2, 4), 10);
               period = null; // Military time is also 24-hour format
             } else {
               throw new Error(`Unrecognized time format: ${timeString}`);
             }
          }
        }
      }
    }
    
    // Validate time values
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time values in: ${timeString}`);
    }
    
    if (minutes < 0 || minutes > 59) {
      throw new Error(`Invalid minutes value: ${minutes}. Must be 0-59`);
    }
    
         // Handle validation based on format
     if (period === 'AM' || period === 'PM') {
       // 12-hour format validation
       if (hours < 1 || hours > 12) {
         throw new Error(`Invalid hours value for 12-hour format: ${hours}. Must be 1-12. For time "${timeString}", please use a valid 12-hour format like "3:30 PM" or "15:30" for 24-hour format.`);
       }
     } else {
       // 24-hour format validation (when period is null)
       if (hours < 0 || hours > 23) {
         throw new Error(`Invalid hours value for 24-hour format: ${hours}. Must be 0-23`);
       }
     }
    
         const newDate = new Date(dateObj);
     let adjustedHours = hours;
     
     // Convert 12-hour to 24-hour format only if period is specified
     if (period === 'PM' && hours !== 12) {
       adjustedHours += 12;
     } else if (period === 'AM' && hours === 12) {
       adjustedHours = 0;
     }
     // If period is null, it's already 24-hour format, so no conversion needed
     
     newDate.setHours(adjustedHours, minutes, 0, 0);
    
         console.log(`Parsed time ${timeString} to:`, {
       original: newDate.toISOString(),
       localTime: newDate.toLocaleTimeString(),
       hours: adjustedHours,
       minutes,
       period: period || '24h',
       format: period ? '12h' : '24h'
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
        "Invalid time range format. Expected format: START_TIME - END_TIME\n" +
        "Supported time formats:\n" +
        "- 12-hour: 09:00 AM - 05:00 PM\n" +
        "- 24-hour: 09:00 - 17:00\n" +
        "- Single digit: 9:00 AM - 5:00 PM\n" +
        "- Military: 0900 - 1700\n" +
        "- Dot separator: 09.00 AM - 05.00 PM"
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

// Export the checkForDuplicateEvent function
export const checkForDuplicateEvent = async (eventMetadata) => {
  try {
    // Validate that all required fields are present and not undefined
    if (!eventMetadata.eventName) {
      throw new Error("Event name is required for duplicate check");
    }
    if (!eventMetadata.eventDate) {
      throw new Error("Event date is required for duplicate check");
    }
    if (!eventMetadata.eventVenue) {
      throw new Error("Event venue is required for duplicate check");
    }

    // Check for exact match of name, date, and venue combination using Firebase
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
    const q = query(
      eventsRef,
      where("eventName", "==", eventMetadata.eventName),
      where("eventDate", "==", eventMetadata.eventDate),
      where("eventVenue", "==", eventMetadata.eventVenue)
    );
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      isDuplicate: documents.length > 0,
      existingEvent: documents[0] || null,
    };
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

// Update the formatEventPreview function to handle both Excel and CSV
export const formatEventPreview = (data) => {
  console.log("Formatting preview data:", data);

  if (data.fileType === 'csv') {
    // Handle CSV preview - show first event as preview
    const event = data.eventMetadata;
    return {
      fileType: 'csv',
      totalEvents: data.allEvents.length,
      eventName: event.eventName,
      eventDate: formatDateForDisplay(event.eventDate),
      eventTime: `${formatTime(event.eventTimeFrom)} - ${formatTime(event.eventTimeTo)}`,
      duration: calculateDuration(event.eventTimeFrom, event.eventTimeTo).toString(),
      eventVenue: event.eventLocation,
      eventType: event.eventType,
      eventDescription: event.eventDescription,
      maxParticipants: event.maxParticipants,
      organizerName: event.organizerName,
      contactEmail: event.contactEmail,
      contactPhone: event.contactPhone,
      eventStatus: event.eventStatus,
      registrationDeadline: event.registrationDeadline ? formatDateForDisplay(event.registrationDeadline) : 'Not specified',
      allEvents: data.allEvents, // Include all events for processing
    };
  } else {
    // Handle Excel preview (existing logic)
    return {
      fileType: 'excel',
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
  }
};

// Update the handleFileChange function to handle both Excel and CSV
export const handleFileChange = async (file) => {
  try {
    const fileData = await readFileEnhanced(file);

    if (fileData.type === 'csv') {
      // Handle CSV file
      const events = extractEventDataFromCSV(fileData.data);
      
      // For CSV, we'll return the first event as eventMetadata and all events as a separate array
      const eventMetadata = events[0];
      const allEvents = events;

      return {
        eventMetadata,
        allEvents, // New field for multiple events from CSV
        fileType: 'csv',
        totalParticipants: 0, // CSV doesn't include participant data
        participantDetails: {
          male: 0,
          female: 0,
          students: 0,
          staffFaculty: 0,
          community: 0,
        },
        participants: [],
        staffFaculty: [],
        community: [],
      };
    } else {
      // Handle Excel file (existing logic)
      const excelData = fileData.data;
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
    }
  } catch (error) {
    throw error;
  }
};

// CSV-specific import functions
export const extractEventDataFromCSV = (csvData) => {
  console.log("Processing CSV data:", csvData);
  
  if (!Array.isArray(csvData) || csvData.length < 2) {
    throw new Error("Invalid CSV format: File must contain at least a header row and one data row");
  }

  const headers = csvData[0];
  const events = [];

  // Find column indices
  const getColumnIndex = (columnName) => {
    const index = headers.findIndex(header => 
      header.toLowerCase().includes(columnName.toLowerCase())
    );
    if (index === -1) {
      throw new Error(`Required column not found: ${columnName}`);
    }
    return index;
  };

  try {
    const eventNameIndex = getColumnIndex('Event Name');
    const eventDateIndex = getColumnIndex('Event Date');
    const eventTimeIndex = getColumnIndex('Event Time');
    const eventLocationIndex = getColumnIndex('Event Location');
    const eventDescriptionIndex = getColumnIndex('Event Description');
    const eventTypeIndex = getColumnIndex('Event Type');
    const maxParticipantsIndex = getColumnIndex('Max Participants');
    const registrationDeadlineIndex = getColumnIndex('Registration Deadline');
    const eventStatusIndex = getColumnIndex('Event Status');
    const organizerNameIndex = getColumnIndex('Organizer Name');
    const contactEmailIndex = getColumnIndex('Contact Email');
    const contactPhoneIndex = getColumnIndex('Contact Phone');
    const academicPeriodIdIndex = getColumnIndex('Academic Period ID');
    const isArchivedIndex = getColumnIndex('Is Archived');

    // Process each data row
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];
      if (!row || row.length === 0) continue;

      const eventName = row[eventNameIndex]?.trim();
      const eventDate = row[eventDateIndex]?.trim();
      const eventTime = row[eventTimeIndex]?.trim();
      const eventLocation = row[eventLocationIndex]?.trim();
      const eventDescription = row[eventDescriptionIndex]?.trim();
      const eventType = row[eventTypeIndex]?.trim();
      const maxParticipants = row[maxParticipantsIndex]?.trim();
      const registrationDeadline = row[registrationDeadlineIndex]?.trim();
      const eventStatus = row[eventStatusIndex]?.trim();
      const organizerName = row[organizerNameIndex]?.trim();
      const contactEmail = row[contactEmailIndex]?.trim();
      const contactPhone = row[contactPhoneIndex]?.trim();
      const academicPeriodId = row[academicPeriodIdIndex]?.trim();
      const isArchived = row[isArchivedIndex]?.trim();

      // Validate required fields
      if (!eventName) throw new Error(`Row ${i + 1}: Event Name is required`);
      if (!eventDate) throw new Error(`Row ${i + 1}: Event Date is required`);
      if (!eventTime) throw new Error(`Row ${i + 1}: Event Time is required`);
      if (!eventLocation) throw new Error(`Row ${i + 1}: Event Location is required`);
      if (!eventType) throw new Error(`Row ${i + 1}: Event Type is required`);

      // Parse time range
      if (!eventTime.includes("-")) {
        throw new Error(
          `Row ${i + 1}: Invalid time range format. Expected format: START_TIME - END_TIME\n` +
          "Supported time formats:\n" +
          "- 12-hour: 09:00 AM - 05:00 PM\n" +
          "- 24-hour: 09:00 - 17:00\n" +
          "- Single digit: 9:00 AM - 5:00 PM\n" +
          "- Military: 0900 - 1700\n" +
          "- Dot separator: 09.00 AM - 05.00 PM"
        );
      }

      const [eventTimeFrom, eventTimeTo] = eventTime.split("-").map(t => t.trim());

      // Parse the date
      const parsedEventDate = formatDateForDatabase(eventDate);
      if (!parsedEventDate) {
        throw new Error(`Row ${i + 1}: Invalid date format: ${eventDate}`);
      }

      // Parse times and calculate duration
      const fromDateTime = parseTimeAndSetDate(eventTimeFrom, new Date(parsedEventDate));
      const toDateTime = parseTimeAndSetDate(eventTimeTo, new Date(parsedEventDate));
      const duration = calculateDuration(fromDateTime, toDateTime);

             const event = {
         eventName,
         eventDate: parsedEventDate,
         eventTimeFrom: fromDateTime.toISOString(),
         eventTimeTo: toDateTime.toISOString(),
         eventVenue: eventLocation, // Map eventLocation to eventVenue for Firebase compatibility
         eventLocation, // Keep original for backward compatibility
         eventDescription: eventDescription || "",
         eventType,
         maxParticipants: parseInt(maxParticipants) || 0,
         registrationDeadline: registrationDeadline ? formatDateForDatabase(registrationDeadline) : null,
         eventStatus: eventStatus || "Active",
         organizerName,
         contactEmail,
         contactPhone,
         academicPeriodId: academicPeriodId || "current_period_id", // This will be resolved in importEventsFromCSV
         isArchived: isArchived === "true" || isArchived === "1",
         numberOfHours: String(duration.hours),
       };

      events.push(event);
    }

    console.log("Extracted events from CSV:", events);
    return events;
  } catch (error) {
    console.error("Error extracting event data from CSV:", error);
    throw new Error(`Failed to extract event data from CSV: ${error.message}`);
  }
};

// Enhanced readFile function to handle both Excel and CSV
export const readFileEnhanced = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const binaryString = event.target?.result;
        if (typeof binaryString !== "string") {
          throw new Error("Failed to read file as binary string.");
        }

        // Check if it's a CSV file
        if (file.name.toLowerCase().endsWith('.csv')) {
          // Parse CSV using Papa Parse or simple parsing
          const lines = binaryString.split('\n');
          const csvData = lines.map(line => 
            line.split(',').map(cell => 
              cell.replace(/^"|"$/g, '').trim() // Remove quotes and trim
            )
          ).filter(row => row.length > 0 && row.some(cell => cell !== '')); // Remove empty rows
          
          console.log("Parsed CSV Data:", csvData);
          resolve({ type: 'csv', data: csvData });
        } else {
          // Parse Excel file
          const workbook = XLSX.read(binaryString, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          console.log("Parsed Excel Data:", data);
          resolve({ type: 'excel', data: data });
        }
      } catch (error) {
        console.error("Error parsing file:", error);
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
