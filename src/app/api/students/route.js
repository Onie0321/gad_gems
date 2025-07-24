import { NextResponse } from "next/server";
import { databases, databaseId, studentCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const includeArchived = searchParams.get("includeArchived") === "true";

    // Validate parameters
    if (page < 1) {
      return NextResponse.json(
        { error: "Page must be greater than 0" },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Build query array - BYPASSING ACADEMIC PERIOD FILTERING
    const queries = [];

    if (!includeArchived) {
      queries.push(Query.equal("isArchived", false));
    }

    // Add pagination
    queries.push(Query.limit(limit));
    queries.push(Query.offset((page - 1) * limit));

    // Add sorting by creation date (newest first)
    queries.push(Query.orderDesc("$createdAt"));

    console.log("Fetching students with queries (BYPASSING ACADEMIC PERIOD):", {
      page,
      limit,
      includeArchived,
      queries: queries.map((q) => q.toString()),
    });

    // Fetch students from Appwrite
    const response = await databases.listDocuments(
      databaseId,
      studentCollectionId,
      queries
    );

    console.log("Students response:", {
      total: response.total,
      documents: response.documents.length,
      page,
      limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(response.total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        students: response.documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: response.total,
          itemsPerPage: limit,
          hasNextPage,
          hasPreviousPage,
          startIndex: (page - 1) * limit + 1,
          endIndex: Math.min(page * limit, response.total),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch students",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle POST requests for creating new students
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name"];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Create student document
    const response = await databases.createDocument(
      databaseId,
      studentCollectionId,
      "unique()",
      {
        ...body,
        isArchived: false,
        createdAt: new Date().toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error creating student:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create student",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
