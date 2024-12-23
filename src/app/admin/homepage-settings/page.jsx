"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, Trash } from "lucide-react";
import {
  databases,
  databaseId,
  eventCollectionId,
  newsCollectionId,
} from "@/lib/appwrite";
import { ID } from "appwrite";

export default function ContentManagement() {
  const [events, setEvents] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    date: "",
    location: "",
    attendees: 0,
    imageUrl: "",
  });
  const [newNewsItem, setNewNewsItem] = useState({
    title: "",
    description: "",
    date: "",
    imageUrl: "",
    link: "",
  });

  useEffect(() => {
    fetchEvents();
    fetchNewsItems();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        eventCollectionId
      );
      setEvents(response.documents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchNewsItems = async () => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        newsCollectionId
      );
      setNewsItems(response.documents);
    } catch (error) {
      console.error("Error fetching news items:", error);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await databases.createDocument(
        databaseId,
        eventCollectionId,
        ID.unique(),
        newEvent
      );
      setNewEvent({
        name: "",
        description: "",
        date: "",
        location: "",
        attendees: 0,
        imageUrl: "",
      });
      fetchEvents();
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleAddNewsItem = async (e) => {
    e.preventDefault();
    try {
      await databases.createDocument(
        databaseId,
        newsCollectionId,
        ID.unique(),
        newNewsItem
      );
      setNewNewsItem({
        title: "",
        description: "",
        date: "",
        imageUrl: "",
        link: "",
      });
      fetchNewsItems();
    } catch (error) {
      console.error("Error adding news item:", error);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await databases.deleteDocument(databaseId, eventCollectionId, id);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleDeleteNewsItem = async (id) => {
    try {
      await databases.deleteDocument(databaseId, newsCollectionId, id);
      fetchNewsItems();
    } catch (error) {
      console.error("Error deleting news item:", error);
    }
  };

  if (loading) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Content Management</h2>
      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="news">Latest News</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={newEvent.name}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, location: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="attendees">Attendees</Label>
                <Input
                  id="attendees"
                  type="number"
                  value={newEvent.attendees}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      attendees: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={newEvent.imageUrl}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, imageUrl: e.target.value })
                }
              />
            </div>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </form>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{event.description}</p>
                  <p>Date: {event.date}</p>
                  <p>Location: {event.location}</p>
                  <p>Attendees: {event.attendees}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="news">
          <form onSubmit={handleAddNewsItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newNewsItem.title}
                  onChange={(e) =>
                    setNewNewsItem({ ...newNewsItem, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newNewsItem.date}
                  onChange={(e) =>
                    setNewNewsItem({ ...newNewsItem, date: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newNewsItem.description}
                onChange={(e) =>
                  setNewNewsItem({
                    ...newNewsItem,
                    description: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={newNewsItem.imageUrl}
                onChange={(e) =>
                  setNewNewsItem({ ...newNewsItem, imageUrl: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                value={newNewsItem.link}
                onChange={(e) =>
                  setNewNewsItem({ ...newNewsItem, link: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" /> Add News Item
            </Button>
          </form>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {newsItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{item.description}</p>
                  <p>Date: {item.date}</p>
                  <p>Link: {item.link}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteNewsItem(item.id)}
                  >
                    <Trash className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
