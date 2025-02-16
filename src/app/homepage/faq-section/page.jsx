"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

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
    <section id="faq" className="py-16 bg-gradient-to-br from-white via-violet-50/30 to-blue-50/30">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="w-8 h-8 text-violet-600" />
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">
              Frequently Asked Questions
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our services and programs
          </p>
        </motion.div>
        <Accordion
          type="single"
          collapsible
          className="w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-sm shadow-sm ring-1 ring-gray-200/50 rounded-2xl p-6"
        >
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border-b border-violet-100 last:border-0"
            >
              <AccordionTrigger className="text-lg font-semibold hover:text-violet-600 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

