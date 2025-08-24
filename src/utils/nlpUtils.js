import { query, collection, where, getDocs, db, COLLECTIONS } from '@/lib/firebase';

export function parseNaturalLanguageQuery(input) {
  const query = {};

  // Gender
  if (input.toLowerCase().includes('male')) query.gender = 'male';
  if (input.toLowerCase().includes('female')) query.gender = 'female';

  // Date Range
  const dateRegex = /between (\w+ \d{1,2},? \d{4}) and (\w+ \d{1,2},? \d{4})/i;
  const dateMatch = input.match(dateRegex);
  if (dateMatch) {
    query.dateRange = {
      start: new Date(dateMatch[1]).toISOString(),
      end: new Date(dateMatch[2]).toISOString(),
    };
  }

  // Age Range
  const ageRegex = /aged? (\d+)(?:-(\d+))?/i;
  const ageMatch = input.match(ageRegex);
  if (ageMatch) {
    query.ageRange = {
      min: parseInt(ageMatch[1]),
      max: ageMatch[2] ? parseInt(ageMatch[2]) : undefined,
    };
  }

  // Event Names
  const eventRegex = /in (\w+(?:\s+\w+)*) event/i;
  const eventMatch = input.match(eventRegex);
  if (eventMatch) {
    query.eventNames = [eventMatch[1]];
  }

  // Event Type
  const eventTypeRegex = /event type:? (\w+(?:\s+\w+)*)/i;
  const eventTypeMatch = input.match(eventTypeRegex);
  if (eventTypeMatch) {
    query.eventType = eventTypeMatch[1];
  }

  // Event Category
  const eventCategoryRegex = /event category:? (\w+(?:\s+\w+)*)/i;
  const eventCategoryMatch = input.match(eventCategoryRegex);
  if (eventCategoryMatch) {
    query.eventCategory = eventCategoryMatch[1];
  }

  // Year
  const yearRegex = /year (\d{4})/i;
  const yearMatch = input.match(yearRegex);
  if (yearMatch) {
    query.year = parseInt(yearMatch[1]);
  }

  // Section
  const sectionRegex = /section (\w+)/i;
  const sectionMatch = input.match(sectionRegex);
  if (sectionMatch) {
    query.section = sectionMatch[1];
  }

  // Ethnic Group
  const ethnicGroupRegex = /ethnic group:? (\w+(?:\s+\w+)*)/i;
  const ethnicGroupMatch = input.match(ethnicGroupRegex);
  if (ethnicGroupMatch) {
    query.ethnicGroup = ethnicGroupMatch[1];
  }

  return query;
}

export function buildFirebaseQueries(parsedQuery) {
  const whereConditions = [];

  if (parsedQuery.gender) {
    whereConditions.push(where('sex', '==', parsedQuery.gender));
  }

  if (parsedQuery.dateRange) {
    whereConditions.push(where('eventDetails.eventDate', '>=', parsedQuery.dateRange.start));
    whereConditions.push(where('eventDetails.eventDate', '<=', parsedQuery.dateRange.end));
  }

  if (parsedQuery.ageRange) {
    if (parsedQuery.ageRange.min) {
      whereConditions.push(where('age', '>=', parsedQuery.ageRange.min));
    }
    if (parsedQuery.ageRange.max) {
      whereConditions.push(where('age', '<=', parsedQuery.ageRange.max));
    }
  }

  if (parsedQuery.eventNames) {
    whereConditions.push(where('eventDetails.eventName', '==', parsedQuery.eventNames[0]));
  }

  if (parsedQuery.eventType) {
    whereConditions.push(where('eventDetails.eventType', '==', parsedQuery.eventType));
  }

  if (parsedQuery.eventCategory) {
    whereConditions.push(where('eventDetails.eventCategory', '==', parsedQuery.eventCategory));
  }

  if (parsedQuery.year) {
    whereConditions.push(where('year', '==', parsedQuery.year.toString()));
  }

  if (parsedQuery.section) {
    whereConditions.push(where('section', '==', parsedQuery.section));
  }

  if (parsedQuery.ethnicGroup) {
    whereConditions.push(where('ethnicGroup', '==', parsedQuery.ethnicGroup));
  }

  // Build a single query with all conditions
  if (whereConditions.length > 0) {
    return query(collection(db, COLLECTIONS.STUDENTS), ...whereConditions);
  }

  // Return a query for all students if no conditions
  return query(collection(db, COLLECTIONS.STUDENTS));
}

// Helper function to execute the query and return results
export async function executeNaturalLanguageQuery(input) {
  try {
    const parsedQuery = parseNaturalLanguageQuery(input);
    const firebaseQuery = buildFirebaseQueries(parsedQuery);
    const querySnapshot = await getDocs(firebaseQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error executing natural language query:', error);
    throw error;
  }
}

