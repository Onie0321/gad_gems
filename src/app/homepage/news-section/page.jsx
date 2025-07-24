"use client";

import React, { useState, useEffect } from "react";
import { databases, databaseId, newsCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { NewsSearch } from "./NewsSearch";

export default function NewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          newsCollectionId,
          [
            Query.equal("isArchived", false),
            Query.equal("showOnHomepage", true),
            Query.orderDesc("date")
          ]
        );

        // Get only the 3 most recent news items
        const recentNews = response.documents.slice(0, 3);
        setNews(recentNews);
      } catch (error) {
        console.error("Error fetching news:", error);
        setError("Failed to load news");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleSearchResults = (results) => {
    setNews(results);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Latest News</h2>
        
        <div className="mb-8">
          <NewsSearch onSearchResults={handleSearchResults} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <Card key={item.$id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {item.title}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  {format(new Date(item.date), "MMMM d, yyyy")}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {item.description}
                </p>
                <Link href={`/news/${item.$id}`}>
                  <Button className="w-full">Read More</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {news.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No news found. Please try a different search term.
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/news">
            <Button variant="outline">View All News</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
