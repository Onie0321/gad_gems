// components/SelectStatus.jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SelectStatus({ status, onStatusChange, className }) {
  return (
    <Select value={status} onValueChange={onStatusChange}>
      <SelectTrigger
        className={`${className} cursor-pointer hover:opacity-80 transition-opacity`}
      >
        <SelectValue>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              status === "approved"
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            } transition-colors duration-200`}
          >
            {status}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending" className="cursor-pointer">
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors duration-200">
            Pending
          </span>
        </SelectItem>
        <SelectItem value="approved" className="cursor-pointer">
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200">
            Approved
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
