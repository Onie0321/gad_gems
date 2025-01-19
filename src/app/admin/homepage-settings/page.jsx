"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  databases,
  databaseId,
  eventCollectionId,
  newsCollectionId,
  getCurrentUser,
} from "@/lib/appwrite";
import { ID } from "appwrite";

// Form schema for news creation
const newsFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  showOnHomepage: z.boolean().default(false),
});

function ContentManagementClient() {
  const [events, setEvents] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [selectedNews, setSelectedNews] = useState([]);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      date: new Date().toISOString().split("T")[0],
      showOnHomepage: false,
    },
  });

  const fetchEvents = async () => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        eventCollectionId
      );
      const events = response.documents;
      setEvents(events);

      // Set initially selected events (those with showOnHomepage = true)
      setSelectedEvents(
        events.filter((event) => event.showOnHomepage).map((event) => event.$id)
      );

      return true;
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const fetchNewsItems = async () => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        newsCollectionId
      );
      setNewsItems(response.documents);

      // Set initially selected news items
      setSelectedNews(
        response.documents
          .filter((news) => news.showOnHomepage)
          .map((news) => news.$id)
      );

      return true;
    } catch (error) {
      console.error("Error fetching news items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch news items. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleEventSelection = async (eventId) => {
    try {
      const newSelectedEvents = selectedEvents.includes(eventId)
        ? selectedEvents.filter((id) => id !== eventId)
        : [...selectedEvents, eventId];

      // Update the event in the database
      await databases.updateDocument(databaseId, eventCollectionId, eventId, {
        showOnHomepage: !selectedEvents.includes(eventId),
      });

      setSelectedEvents(newSelectedEvents);

      toast({
        title: "Success",
        description: "Homepage events updated successfully",
      });
    } catch (error) {
      console.error("Error updating event visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update event visibility",
        variant: "destructive",
      });
    }
  };

  const handleNewsSelection = async (newsId) => {
    try {
      const newSelectedNews = selectedNews.includes(newsId)
        ? selectedNews.filter((id) => id !== newsId)
        : [...selectedNews, newsId];

      // Update the news item in the database
      await databases.updateDocument(databaseId, newsCollectionId, newsId, {
        showOnHomepage: !selectedNews.includes(newsId),
      });

      setSelectedNews(newSelectedNews);

      toast({
        title: "Success",
        description: "Homepage news updated successfully",
      });
    } catch (error) {
      console.error("Error updating news visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update news visibility",
        variant: "destructive",
      });
    }
  };

  const onSubmitNews = async (data) => {
    try {
      // Remove imageUrl if it's empty
      const newsData = {
        ...data,
        showOnHomepage: true,
      };

      if (!newsData.imageUrl) {
        delete newsData.imageUrl; // Remove the imageUrl field if it's empty
      }

      await databases.createDocument(
        databaseId,
        newsCollectionId,
        ID.unique(),
        newsData
      );

      toast({
        title: "Success",
        description: "News item created successfully",
      });

      // Refresh news items
      await fetchNewsItems();
      setIsNewsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating news item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create news item",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          toast({
            title: "Authentication Error",
            description: "Please sign in to access this page",
            variant: "destructive",
          });
          return;
        }

        // Fetch both events and news items
        await Promise.all([fetchEvents(), fetchNewsItems()]);
      } catch (error) {
        console.error("Initialization error:", error);
        toast({
          title: "Error",
          description: "Failed to load content. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false); // Always set loading to false, even if there's an error
      }
    };

    initializeData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Content Management</h2>

      {/* Events Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          Select Events to Show on Homepage
        </h3>
        {events.length > 0 ? (
          <div className="grid gap-4">
            {events.map((event) => (
              <div
                key={event.$id}
                className="flex items-center space-x-4 p-4 border rounded"
              >
                <Checkbox
                  checked={selectedEvents.includes(event.$id)}
                  onCheckedChange={() => handleEventSelection(event.$id)}
                />
                <div className="flex-1">
                  <h4 className="font-semibold">{event.eventName}</h4>
                  <p className="text-sm text-gray-600">
                    Date: {event.eventDate}
                  </p>
                  <p className="text-sm text-gray-600">
                    Venue: {event.eventVenue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No events found.</p>
        )}
      </div>

      {/* News Items Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">News Items</h3>
          <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add News
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create News Item</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmitNews)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Create News</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {newsItems.length > 0 ? (
          <div className="grid gap-4">
            {newsItems.map((item) => (
              <div
                key={item.$id}
                className="flex items-center space-x-4 p-4 border rounded"
              >
                <Checkbox
                  checked={selectedNews.includes(item.$id)}
                  onCheckedChange={() => handleNewsSelection(item.$id)}
                />
                <div className="flex-1">
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <p className="text-sm text-gray-600">Date: {item.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No news items found.</p>
        )}
      </div>
    </div>
  );
}

// Default export is now a server component that renders the client component
export default function ContentManagement() {
  return <ContentManagementClient />;
}
