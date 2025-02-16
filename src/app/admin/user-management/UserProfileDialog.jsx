"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Building,
  Award,
} from "lucide-react";

export default function UserProfileDialog({ isOpen, onClose, user }) {
  if (!user) return null;

  const profileSections = [
    {
      title: "Basic Information",
      items: [
        {
          icon: <User className="h-4 w-4" />,
          label: "Name",
          value: user.name,
        },
        {
          icon: <Mail className="h-4 w-4" />,
          label: "Email",
          value: user.email,
        },
        {
          icon: <Shield className="h-4 w-4" />,
          label: "Role",
          value: user.role,
          format: (value) => value.charAt(0).toUpperCase() + value.slice(1),
        },
      ],
    },
    {
      title: "Account Status",
      items: [
        {
          icon: <CheckCircle2 className="h-4 w-4" />,
          label: "Status",
          value: user.approvalStatus,
          format: (value) => (
            <Badge
              variant="outline"
              className={`${
                value === "approved"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Badge>
          ),
        },
        {
          icon: <Shield className="h-4 w-4" />,
          label: "Verification",
          value: user.emailVerification,
          format: (value) => (
            <Badge
              variant="outline"
              className={`${
                value
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {value ? "Verified" : "Unverified"}
            </Badge>
          ),
        },
      ],
    },
    {
      title: "Additional Details",
      items: [
        {
          icon: <Calendar className="h-4 w-4" />,
          label: "Joined Date",
          value: user.$createdAt,
          format: (value) =>
            format(new Date(value), "MMMM d, yyyy 'at' h:mm aaa"),
        },
        {
          icon: <Clock className="h-4 w-4" />,
          label: "Last Active",
          value: user.lastLogin || user.$updatedAt,
          format: (value) =>
            format(new Date(value), "MMMM d, yyyy 'at' h:mm aaa"),
        },
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            User Profile
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {profileSections.map((section, sectionIndex) => (
            <div key={section.title}>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={item.label}
                    className="flex items-start space-x-3 group"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-2 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                        {item.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500">
                        {item.label}
                      </p>
                      <div className="mt-1 text-sm text-gray-900">
                        {item.format
                          ? item.format(item.value)
                          : item.value || "Not provided"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {sectionIndex < profileSections.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
