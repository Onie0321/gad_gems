export const validateEventForm = (event) => {
  const errors = {};

  // Add a null check for event
  if (!event) {
    errors.event = "Event data is required.";
    return errors;
  }

  if (!event.eventDate) errors.eventDate = "Event date is required";
  if (!event.eventName?.trim()) errors.eventName = "Event name is required";
  if (!event.eventTimeFrom) errors.eventTimeFrom = "Start time is required";
  if (!event.eventTimeTo) errors.eventTimeTo = "End time is required";
  if (!event.eventVenue?.trim()) errors.eventVenue = "Venue is required";
  if (!event.eventType) errors.eventType = "Event type is required";
  if (!event.eventCategory) errors.eventCategory = "Category is required";

  return errors;
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

// src/utils/participantUtils.js

export const getNonAcademicCategories = () => {
  return [
    "Accounting Unit",
    "Admission Office",
    "Budget Unit",
    "Cash Unit",
    "Data Protection Office",
    "Disaster Risk Reduction Management Office",
    "Extension and Rural Development Office",
    "Gender and Development Office",
    "General Services Unit",
    "Guidance Office",
    "Health Services Unit",
    "ICT Unit",
    "IGP and Auxiliary Office",
    "International, External, and Alumni Services Office",
    "Legal Unit",
    "Library",
    "National Service Training Program",
    "Office of Internal Audit",
    "Planning Unit",
    "Procurement Management Unit",
    "Project Management Unit",
    "Quality Assurance Management Office",
    "Records Unit",
    "Research and Development Office",
    "Scholarship Office",
    "Sentro ng Wika at Kultura",
    "Sports Development Unit",
    "Supply Unit",
    "Testing and Evaluation Center",
  ];
};

import { isSameDay } from "date-fns";

export const philippineHolidays = [
  // Regular Holidays
  { date: new Date(2024, 0, 1), name: "New Year's Day" },
  { date: new Date(2024, 3, 9), name: "Day of Valor (Araw ng Kagitingan)" },
  { date: new Date(2024, 3, 28), name: "Maundy Thursday (Huwebes Santo)" },
  { date: new Date(2024, 3, 29), name: "Good Friday (Biyernes Santo)" },
  { date: new Date(2024, 4, 1), name: "Labor Day (Araw ng Paggawa)" },
  { date: new Date(2024, 5, 12), name: "Independence Day (Araw ng Kalayaan)" },
  {
    date: new Date(2024, 7, 26),
    name: "National Heroes Day (Araw ng mga Bayani)",
  },
  { date: new Date(2024, 10, 30), name: "Bonifacio Day (Araw ni Bonifacio)" },
  { date: new Date(2024, 11, 25), name: "Christmas Day (Araw ng Pasko)" },
  { date: new Date(2024, 11, 30), name: "Rizal Day (Araw ni Rizal)" },

  // Special (Non-Working) Days
  {
    date: new Date(2024, 1, 10),
    name: "Chinese New Year (Bagong Taon ng mga Tsino)",
  },
  { date: new Date(2024, 2, 30), name: "Black Saturday (Sabado de Gloria)" },
  {
    date: new Date(2024, 7, 21),
    name: "Ninoy Aquino Day (Araw ng Kabayanihan ni Ninoy Aquino)",
  },
  { date: new Date(2024, 10, 1), name: "All Saints' Day (Araw ng mga Santo)" },
  {
    date: new Date(2024, 10, 2),
    name: "All Souls' Day (Araw ng mga Kaluluwa)",
  },
  {
    date: new Date(2024, 11, 8),
    name: "Feast of the Immaculate Conception (Kapistahan ng Kalinis-linisang Paglilihi)",
  },
  { date: new Date(2024, 11, 24), name: "Christmas Eve (Bisperas ng Pasko)" },
  {
    date: new Date(2024, 11, 31),
    name: "New Year's Eve (Bisperas ng Bagong Taon)",
  },

  // Movable Islamic Holidays
  { date: new Date(2024, 3, 10), name: "Eid'l Fitr (Araw ng Ramadan)" }, // Date may vary
  { date: new Date(2024, 5, 17), name: "Eid'l Adha (Araw ng Kurban)" }, // Date may vary

  // Aurora-Specific Holidays
  { date: new Date(2024, 1, 19), name: "Aurora Day (Araw ng Aurora)" },
];

export const isPhilippineHoliday = (date) => {
  return philippineHolidays.some((holiday) => isSameDay(holiday.date, date));
};
