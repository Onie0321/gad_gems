
"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
export default function FAQSection() {
  const faqs = [
    {
      question: "What is the GAD Office?",
      answer:
        "The Gender and Development (GAD) Office is a department dedicated to promoting gender equality and inclusive development in our community through various programs, policies, and initiatives.",
    },
    {
      question: "How can I participate in GAD events?",
      answer:
        "You can participate in GAD events by registering through our website or contacting our office directly. We regularly post upcoming events in the Events section of our website.",
    },
    {
      question: "What resources does the GAD Office provide?",
      answer:
        "The GAD Office provides a wide range of resources including educational materials, training programs, counseling services, and support for gender-related issues. You can find more information in our Resources section.",
    },
    {
      question: "How can I support the GAD Office's initiatives?",
      answer:
        "You can support our initiatives by volunteering, attending our events, spreading awareness about our programs, or making donations to support our work. Contact us for more information on how you can get involved.",
    },
  ];

  return (
    <section id="faq" className="py-12 rounded-lg">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">FAQ</h2>
        <Accordion
          type="single"
          collapsible
          className="w-full max-w-2xl mx-auto shadow-md p-4 rounded-lg"
        >
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="p-4 rounded-md">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

