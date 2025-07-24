"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import EthnicitySelect from "./EthnicitySelect";

export default function EthnicitySelectExample() {
  const [selectedEthnicity, setSelectedEthnicity] = useState("");
  const [otherEthnicity, setOtherEthnicity] = useState("");

  const handleEthnicityChange = (value) => {
    setSelectedEthnicity(value);
    if (value !== "Other") {
      setOtherEthnicity("");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Ethnicity Selection Example</h3>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ethnicGroup" className="text-right">
          Ethnic Group
        </Label>
        <EthnicitySelect
          value={selectedEthnicity}
          onChange={handleEthnicityChange}
          className="col-span-3"
        />
      </div>

      {selectedEthnicity === "Other" && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="otherEthnicGroup" className="text-right">
            Specify Ethnic Group
          </Label>
          <input
            id="otherEthnicGroup"
            type="text"
            value={otherEthnicity}
            onChange={(e) => setOtherEthnicity(e.target.value)}
            className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter ethnic group"
          />
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-100 rounded">
        <p>
          <strong>Selected Ethnicity:</strong> {selectedEthnicity}
        </p>
        {selectedEthnicity === "Other" && otherEthnicity && (
          <p>
            <strong>Specified Ethnicity:</strong> {otherEthnicity}
          </p>
        )}
      </div>
    </div>
  );
}
