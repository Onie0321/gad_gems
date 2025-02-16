import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WelcomeModal = ({
  isOpen,
  onClose,
  userName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to GADConnect!</DialogTitle>
          <DialogDescription>
            Hello {userName}, we&apos;re excited to have you on board. GADConnect is
            your all-in-one platform for event management and demographic
            analysis. Here&apos;s what you can do:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ul className="list-disc list-inside space-y-2">
            <li>Create and manage events</li>
            <li>Track participant demographics</li>
            <li>Generate insightful reports</li>
            <li>Collaborate with your team</li>
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;

