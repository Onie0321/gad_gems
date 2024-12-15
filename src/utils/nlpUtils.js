import { Query } from 'appwrite';

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

export function buildAppwriteQueries(parsedQuery) {
  const queries = [];

  if (parsedQuery.gender) {
    queries.push(Query.equal('sex', parsedQuery.gender));
  }

  if (parsedQuery.dateRange) {
    queries.push(Query.greaterThanEqual('eventDetails.eventDate', parsedQuery.dateRange.start));
    queries.push(Query.lessThanEqual('eventDetails.eventDate', parsedQuery.dateRange.end));
  }

  if (parsedQuery.ageRange) {
    if (parsedQuery.ageRange.min) {
      queries.push(Query.greaterThanEqual('age', parsedQuery.ageRange.min));
    }
    if (parsedQuery.ageRange.max) {
      queries.push(Query.lessThanEqual('age', parsedQuery.ageRange.max));
    }
  }

  if (parsedQuery.eventNames) {
    queries.push(Query.search('eventDetails.eventName', parsedQuery.eventNames[0]));
  }

  if (parsedQuery.eventType) {
    queries.push(Query.equal('eventDetails.eventType', parsedQuery.eventType));
  }

  if (parsedQuery.eventCategory) {
    queries.push(Query.equal('eventDetails.eventCategory', parsedQuery.eventCategory));
  }

  if (parsedQuery.year) {
    queries.push(Query.equal('year', parsedQuery.year.toString()));
  }

  if (parsedQuery.section) {
    queries.push(Query.equal('section', parsedQuery.section));
  }

  if (parsedQuery.ethnicGroup) {
    queries.push(Query.equal('ethnicGroup', parsedQuery.ethnicGroup));
  }

  return queries;
}

