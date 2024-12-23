"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";

// This would typically come from an API or database
const initialNews = [
  {
    id: 1,
    title: "New Gender Equality Policy",
    description:
      "Our organization has implemented a new policy to promote gender equality in the workplace.",
    imageUrl: "/placeholder.svg?height=200&width=300",
    date: "2023-07-15",
    link: "/news/1",
  },
  {
    id: 2,
    title: "Women's Day Celebration",
    imageUrl: "/placeholder.svg?height=200&width=300",
    date: "2023-03-08",
    link: "/news/2",
  },
  {
    id: 3,
    description:
      "Read our latest report on the current state of the gender pay gap in our industry.",
    date: "2023-06-30",
    link: "/news/3",
  },
  {
    id: 4,
    title: "Diversity Training Program",
    description:
      "We're launching a new diversity training program next month. Learn more about it here.",
    link: "/news/4",
  },
];

export default function NewsSection() {
  const [mounted, setMounted] = useState(false);
  const [news, setNews] = useState(initialNews);
  const [visibleNews, setVisibleNews] = useState(3);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadMore = () => {
    setVisibleNews((prevVisible) => prevVisible + 3);
  };

  const renderContent = () => {
    if (!mounted) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col h-full">
              <div className="h-48 bg-gray-100 rounded-t-lg animate-pulse" />
              <CardHeader>
                <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse mt-2" />
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="h-20 bg-gray-100 rounded animate-pulse" />
              </CardContent>
              <CardFooter>
                <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.slice(0, visibleNews).map((item) => (
          <Card key={item.id} className="flex flex-col h-full">
            {item.imageUrl && (
              <div className="relative w-full h-48">
                <Image
                  src={item.imageUrl}
                  alt={item.title || "News image"}
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
            )}
            <CardHeader>
              {item.title && <CardTitle>{item.title}</CardTitle>}
              {item.date && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>{item.date}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-grow">
              {item.description && (
                <p className="text-muted-foreground">{item.description}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <a href={item.link}>Read More</a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Latest News</h2>
        {renderContent()}
        {mounted && visibleNews < news.length && (
          <div className="mt-8 text-center">
            <Button onClick={loadMore}>See More</Button>
          </div>
        )}
      </div>
    </section>
  );
}
