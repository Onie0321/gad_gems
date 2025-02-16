"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
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

// Add this helper function after the newsFormSchema
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
};

function ContentManagementClient() {
  const [events, setEvents] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [selectedNews, setSelectedNews] = useState([]);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [currentEventsPage, setCurrentEventsPage] = useState(1);
  const [currentNewsPage, setCurrentNewsPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

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

  // Add new helper functions for pagination
  const paginateItems = (items, currentPage) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const totalEventsPages = Math.ceil(events.length / ITEMS_PER_PAGE);
  const totalNewsPages = Math.ceil(newsItems.length / ITEMS_PER_PAGE);

  // Add bulk selection handlers
  const handleSelectAllEvents = () => {
    const currentPageEvents = paginateItems(events, currentEventsPage);
    const currentPageIds = currentPageEvents.map((event) => event.$id);

    const allSelected = currentPageIds.every((id) =>
      selectedEvents.includes(id)
    );

    if (allSelected) {
      // Deselect all on current page
      setSelectedEvents(
        selectedEvents.filter((id) => !currentPageIds.includes(id))
      );
      currentPageIds.forEach(async (eventId) => {
        await databases.updateDocument(databaseId, eventCollectionId, eventId, {
          showOnHomepage: false,
        });
      });
    } else {
      // Select all on current page
      const newSelected = [...new Set([...selectedEvents, ...currentPageIds])];
      setSelectedEvents(newSelected);
      currentPageIds.forEach(async (eventId) => {
        await databases.updateDocument(databaseId, eventCollectionId, eventId, {
          showOnHomepage: true,
        });
      });
    }
  };

  const handleSelectAllNews = () => {
    const currentPageNews = paginateItems(newsItems, currentNewsPage);
    const currentPageIds = currentPageNews.map((news) => news.$id);

    const allSelected = currentPageIds.every((id) => selectedNews.includes(id));

    if (allSelected) {
      // Deselect all on current page
      setSelectedNews(
        selectedNews.filter((id) => !currentPageIds.includes(id))
      );
      currentPageIds.forEach(async (newsId) => {
        await databases.updateDocument(databaseId, newsCollectionId, newsId, {
          showOnHomepage: false,
        });
      });
    } else {
      // Select all on current page
      const newSelected = [...new Set([...selectedNews, ...currentPageIds])];
      setSelectedNews(newSelected);
      currentPageIds.forEach(async (newsId) => {
        await databases.updateDocument(databaseId, newsCollectionId, newsId, {
          showOnHomepage: true,
        });
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Content Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Events Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Events </h3>
          <h6 className="text-sm font-semibold">Select Events to Show on Homepage</h6>
          
          {events.length > 0 ? (
            <>
              <div className="grid gap-4">
                {/* Select All Events Checkbox */}
                <div
                  className="flex items-center space-x-4 p-4 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={handleSelectAllEvents}
                >
                  <Checkbox
                    checked={paginateItems(events, currentEventsPage).every(event => 
                      selectedEvents.includes(event.$id))}
                    onCheckedChange={handleSelectAllEvents}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {paginateItems(events, currentEventsPage).every(event => 
                        selectedEvents.includes(event.$id)) ? 'Deselect All Events' : 'Select All Events'}
                    </h4>
                  </div>
                </div>

                {/* Event Cards */}
                {paginateItems(events, currentEventsPage).map((event) => (
                  <div
                    key={event.$id}
                    className="flex items-center space-x-4 p-4 border rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEventSelection(event.$id)}
                  >
                    <Checkbox
                      checked={selectedEvents.includes(event.$id)}
                      onCheckedChange={() => handleEventSelection(event.$id)}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{event.eventName}</h4>
                      <p className="text-sm text-gray-600">
                        Date: {formatDate(event.eventDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Venue: {event.eventVenue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Events Pagination */}
              {totalEventsPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentEventsPage(prev => Math.max(1, prev - 1))}
                    disabled={currentEventsPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center">
                    Page {currentEventsPage} of {totalEventsPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentEventsPage(prev => Math.min(totalEventsPages, prev + 1))}
                    disabled={currentEventsPage === totalEventsPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Add Event Button */}
              <div className="flex justify-end mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </>
          ) : (
            <>
              <p>No events found.</p>
              <div className="flex justify-end mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </>
          )}
        </div>

        {/* News Items Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">News Items</h3>
          <h6 className="text-sm font-semibold">Select News Items to Show on Homepage</h6>  

          {newsItems.length > 0 ? (
            <>
              <div className="grid gap-4">
                {/* Select All News Checkbox */}
                <div
                  className="flex items-center space-x-4 p-4 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={handleSelectAllNews}
                >
                  <Checkbox
                    checked={paginateItems(newsItems, currentNewsPage).every(news => 
                      selectedNews.includes(news.$id))}
                    onCheckedChange={handleSelectAllNews}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {paginateItems(newsItems, currentNewsPage).every(news => 
                        selectedNews.includes(news.$id)) ? 'Deselect All News' : 'Select All News'}
                    </h4>
                  </div>
                </div>

                {/* News Cards */}
                {paginateItems(newsItems, currentNewsPage).map((item) => (
                  <div
                    key={item.$id}
                    className="flex items-center space-x-4 p-4 border rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => handleNewsSelection(item.$id)}
                  >
                    <Checkbox
                      checked={selectedNews.includes(item.$id)}
                      onCheckedChange={() => handleNewsSelection(item.$id)}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-sm text-gray-600">
                        Date: {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* News Pagination */}
              {totalNewsPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentNewsPage(prev => Math.max(1, prev - 1))}
                    disabled={currentNewsPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center">
                    Page {currentNewsPage} of {totalNewsPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentNewsPage(prev => Math.min(totalNewsPages, prev + 1))}
                    disabled={currentNewsPage === totalNewsPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Add News Button */}
              <div className="flex justify-end mt-4">
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
            </>
          ) : (
            <>
              <p>No news items found.</p>
              <div className="flex justify-end mt-4">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Default export is now a server component that renders the client component
export default function ContentManagement() {
  return <ContentManagementClient />;
}
