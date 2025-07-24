"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const ethnicGroups = [
  "Agta",
  "Aeta",
  "Alta",
  "Bag-O",
  "Bicolano",
  "Bisaya",
  "Bugkalot",
  "Casiguranin",
  "Dumagat",
  "Egongot",
  "Filipino",
  "Gaddang",
  "Ibanag",
  "Ifugao",
  "Igorot",
  "Ilocano",
  "Ilongot",
  "Isinay",
  "Itawes",
  "Itneg",
  "Kankana-ey",
  "Mangyan",
  "Tagalog",
  "Cebuano",
  "Waray",
  "Other",
];

export default function EthnicitySelect({
  value,
  onChange,
  className = "col-span-3",
  disabled = false,
}) {
  return (
    <Select
      value={value}
      onValueChange={(val) => {
        onChange(val);
      }}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select ethnic group" />
      </SelectTrigger>
      <SelectContent>
        {ethnicGroups.map((group) => (
          <SelectItem key={group} value={group}>
            {group}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Export the ethnic groups array for use in other components
export { ethnicGroups };
