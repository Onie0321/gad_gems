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