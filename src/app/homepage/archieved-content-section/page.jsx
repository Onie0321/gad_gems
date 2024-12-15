
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pdfjs } from "react-pdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar, FileText, Bell, Award, Users } from "lucide-react";
import { Document, Page } from "react-pdf";
import { Head } from "react-day-picker";
import PropTypes from "prop-types";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.17.264/pdf.worker.min.js`;

export default function ArchivedContentSection() {
  const [showAllButtons, setShowAllButtons] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  const buttons = [
    { title: "Past Events", icon: Calendar, path: "/archived/past-events" },
    { title: "Reports", icon: FileText, path: "/archived/reports" },
    {
      title: "Policy Documents",
      icon: FileText,
      path: "/archived/policy-documents",
    },
    {
      title: "Research Publications",
      icon: FileText,
      path: "/archived/research-publications",
    },
    {
      title: "News Announcements",
      icon: Bell,
      path: "/archived/news-announcements",
    },
    {
      title: "Training Materials",
      icon: FileText,
      path: "/archived/training-materials",
    },
    {
      title: "Recognition Awards",
      icon: Award,
      path: "/archived/recognition-awards",
    },
    { title: "Partnerships", icon: Users, path: "/archived/partnerships" },
    { title: "Pamphlets", icon: FileText, action: () => setShowPDF(true) },
  ];

  return (
    <section id="archived" className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          Archived Content
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {buttons
            .slice(0, showAllButtons ? buttons.length : 3)
            .map((button, index) => (
              <ArchiveCard key={index} {...button} />
            ))}
        </div>
        <div className="text-center mt-8">
          <Button onClick={() => setShowAllButtons(!showAllButtons)}>
            {showAllButtons ? "See Less" : "See More"}
          </Button>
        </div>
        <Dialog open={showPDF} onOpenChange={setShowPDF}>
          <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Pregnancy Pamphlet
              </DialogTitle>
              <DialogDescription>
                Description of the pamphlet content
              </DialogDescription>
            </DialogHeader>
            <PDFViewer file="/docs/pregnancy.pdf" />
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
export const PDFViewer = ({ file }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    // Reset error state when file changes
    setPdfError(null);
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) =>
      Math.min(Math.max(prevPageNumber + offset, 1), numPages || 1)
    );
  };

  const handleError = (error) => {
    console.error("Error while loading PDF:", error);
    setPdfError("Failed to load PDF. Please try again later.");
  };

  if (pdfError) {
    return <div className="text-center text-red-500">{pdfError}</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={handleError}
        loading={<div>Loading PDF...</div>}
      >
        <Page
          pageNumber={pageNumber}
          width={Math.min(
            800,
            typeof window !== "undefined" ? window.innerWidth * 0.8 : 800
          )}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>
      {numPages && (
        <div className="flex items-center gap-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Page {pageNumber} of {numPages}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => changePage(1)}
              disabled={pageNumber >= numPages}
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
export const ArchiveCard = ({ title, icon: Icon, path, action, t }) => {
  const handleClick = () => {
    if (action) {
      action();
    } else if (path) {
      console.log(`Navigating to ${path}`);
    }
  };

  return (
    <Card className="p-6 flex flex-col items-center text-center">
      <div className="mb-4" aria-hidden="true">
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <Button variant="outline" className="w-full" onClick={handleClick}>
        View
      </Button>
    </Card>
  );
};
ArchiveCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  path: PropTypes.string,
  action: PropTypes.func,
  t: PropTypes.shape({
    view: PropTypes.string.isRequired,
  }).isRequired,
};
ArchiveCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  path: PropTypes.string,
  action: PropTypes.func,
  t: PropTypes.shape({
    view: PropTypes.string.isRequired,
  }).isRequired,
};
function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Set up PDF.js worker
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

    // Preload the PDF.js worker
    const workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    const link = document.createElement("link");
    link.href = workerSrc;
    link.rel = "preload";
    link.as = "script";
    document.head.appendChild(link);
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Your App Title</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

