export const saveFormData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving form data:", error);
  }
};

export const loadFormData = (key) => {
  try {
    const savedData = localStorage.getItem(key);
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error("Error loading form data:", error);
    return null;
  }
};

export const clearFormData = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing form data:", error);
  }
};

// Form storage keys
export const STORAGE_KEYS = {
  CREATE_EVENT: "createEventForm",
  PARTICIPANT: "participantForm",
};
