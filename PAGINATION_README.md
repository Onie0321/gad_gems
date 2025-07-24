# Server-Side Pagination Implementation

This document describes the implementation of server-side pagination for the GAD Gems application.

## Overview

The implementation uses:

- **Next.js API Routes** for server-side data fetching
- **Appwrite's Query.limit and Query.offset** for database pagination
- **React hooks** for state management
- **Reusable components** for pagination UI

## Architecture

### 1. API Routes (`src/app/api/`)

#### `/api/students/route.js`

- Handles GET requests for paginated student data
- Supports query parameters: `page`, `limit`, `academicPeriodId`, `includeArchived`
- Returns structured response with data and pagination metadata

#### `/api/staff-faculty/route.js`

- Similar to students API but for staff/faculty data
- Uses `staffFacultyCollectionId` from Appwrite

#### `/api/community/route.js`

- Similar to students API but for community member data
- Uses `communityCollectionId` from Appwrite

### 2. Custom Hook (`src/hooks/usePaginatedData.js`)

Provides a reusable hook for fetching paginated data:

- Manages loading, error, and data states
- Handles API calls with proper error handling
- Provides pagination navigation functions
- Supports conditional fetching based on enabled state

### 3. Pagination Components (`src/components/ui/pagination.jsx`)

#### `Pagination`

- Displays page numbers with ellipsis for large page counts
- Previous/Next navigation buttons
- Loading state support
- Configurable max page numbers to display

#### `PaginationInfo`

- Shows current page range and total items
- Loading state indicator

### 4. Updated ParticipantList Component

The main component now uses:

- `usePaginatedData` hook for each tab (students, staff/faculty, community)
- Proper loading states and error handling
- Server-side pagination instead of client-side
- Real-time total counts in tab headers

## Key Features

### ✅ Server-Side Pagination

- Uses Appwrite's `Query.limit()` and `Query.offset()` for efficient database queries
- Only fetches the required page of data, not all records
- Proper pagination metadata calculation

### ✅ API Route Implementation

- RESTful API design with proper HTTP status codes
- Query parameter validation
- Comprehensive error handling
- Structured JSON responses

### ✅ React Integration

- Custom hook for data fetching and state management
- Automatic refetching when dependencies change
- Loading and error states
- Pagination navigation functions

### ✅ UI Components

- Reusable pagination component
- Loading indicators
- Error message display
- Responsive design

## Usage Examples

### API Endpoints

```javascript
// Fetch first page of students (10 items per page)
GET /api/students?page=1&limit=10&academicPeriodId=period123

// Fetch second page of staff/faculty (15 items per page)
GET /api/staff-faculty?page=2&limit=15&academicPeriodId=period123

// Fetch community members with archived items included
GET /api/community?page=1&limit=20&academicPeriodId=period123&includeArchived=true
```

### React Hook Usage

```javascript
const {
  data: students,
  pagination,
  loading,
  error,
  goToPage,
  nextPage,
  previousPage,
} = usePaginatedData("students", {
  limit: 10,
  academicPeriodId: selectedPeriod,
  enabled: true,
});
```

### Component Usage

```javascript
<Pagination
  currentPage={pagination.currentPage}
  totalPages={pagination.totalPages}
  onPageChange={goToPage}
  loading={loading}
/>

<PaginationInfo pagination={pagination} loading={loading} />
```

## Benefits

1. **Performance**: Only loads required data, reducing memory usage and network traffic
2. **Scalability**: Handles large datasets efficiently
3. **User Experience**: Fast loading times and smooth navigation
4. **Maintainability**: Clean separation of concerns with reusable components
5. **Error Handling**: Comprehensive error states and user feedback

## Testing

To test the implementation:

1. **API Routes**: Visit `/api/test` to verify API functionality
2. **Students**: Navigate to the demographics page and select an academic period
3. **Pagination**: Use the pagination controls to navigate through pages
4. **Error Handling**: Check browser console for detailed error messages

## Future Enhancements

- Add sorting functionality to API routes
- Implement search/filtering capabilities
- Add caching for frequently accessed pages
- Implement infinite scroll as an alternative to pagination
- Add export functionality for paginated data
