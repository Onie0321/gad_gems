"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

export default function FAQSection() {
  const faqs = [
    {
      question: "What is GAD?",
      answer:
        "GAD (Gender and Development) is a development approach that focuses on gender equality and women's empowerment as fundamental human rights and essential for achieving sustainable development.",
    },
    {
      question: "How can I participate in GAD events?",
      answer:
        "You can participate in GAD events by registering through our platform when events are announced. Keep an eye on our Events section for upcoming activities.",
    },
    {
      question: "What services does the GAD office provide?",
      answer:
        "The GAD office provides various services including event organization, gender sensitivity training, policy advocacy, and support for gender-related concerns within the institution.",
    },
    {
      question: "How can I contact the GAD office?",
      answer:
        "You can reach us through our office contact details provided in the Contact section, or visit us directly at our office location during business hours.",
    },
  ];

  return (
    <section
      id="faq"
      className="py-16 bg-gradient-to-br from-[#E3FDFD] via-[#CBF1F5] to-[#E3FDFD]"
    >
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="w-8 h-8 text-[#71C9CE]" />
            <h2 className="text-4xl font-bold text-[#71C9CE]">
              Frequently Asked Questions
            </h2>
          </div>
          <p className="text-[#71C9CE]/90 max-w-2xl mx-auto">
            Find answers to common questions about our services and programs
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white/80 backdrop-blur-sm rounded-lg px-6 border border-[#CBF1F5] data-[state=open]:bg-[#CBF1F5]/20"
              >
                <AccordionTrigger className="text-[#71C9CE] hover:text-[#71C9CE]/90 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#71C9CE]/90">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

