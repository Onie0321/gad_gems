// src/app/admin/events/past-events/page.jsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Eye } from 'lucide-react';
import { databases } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PastEvents() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creators, setCreators] = useState({});
  const { toast } = useToast();

  const fetchUserDetails = async (userId) => {
    try {
      const response = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
        userId
      );
      return response;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID
      );
      
      // Sort events by date in descending order and filter for past events
      const pastEvents = response.documents
        .filter(event => new Date(event.eventDate) < new Date())
        .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

      // Fetch creator details for each event
      const creatorDetails = {};
      await Promise.all(
        pastEvents.map(async (event) => {
          if (event.createdBy) {
            const creator = await fetchUserDetails(event.createdBy);
            if (creator) {
              creatorDetails[event.createdBy] = creator;
            }
          }
        })
      );

      setCreators(creatorDetails);
      setEvents(pastEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEdit = (eventId) => {
    // Implement edit functionality
    console.log("Edit event:", eventId);
  };

  const handleDelete = async (eventId) => {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID,
        eventId
      );
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleView = (eventId) => {
    // Implement view functionality
    console.log("View event:", eventId);
  };

  const getCreatorInfo = (createdBy) => {
    const creator = creators[createdBy];
    return creator ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={creator.avatarUrl}
                  alt={creator.name}
                />
                <AvatarFallback>
                  {creator.name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{creator.name}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Created by: {creator.name}</p>
            <p>Email: {creator.email}</p>
            <p>Role: {creator.role}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <span className="text-muted">Unknown</span>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Events</CardTitle>
        <CardDescription>View and analyze past events.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.$id}>
                <TableCell>{event.eventName}</TableCell>
                <TableCell>
                  {new Date(event.eventDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </TableCell>
                <TableCell>{event.eventVenue}</TableCell>
                <TableCell>{event.participantCount || 0}</TableCell>
                <TableCell>{getCreatorInfo(event.createdBy)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(event.$id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(event.$id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(event.$id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}