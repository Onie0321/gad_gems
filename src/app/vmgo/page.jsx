"use client";
import React, { useState, useEffect } from "react";
const VMGO = () => {
  // Simulating a client-side data fetch
  const [vmgoData, setVmgoData] = useState(null);
  useEffect(() => {
    // Simulate a data fetch with a delay
    setTimeout(() => {
      setVmgoData({
        vision:
          "ASCOT 2030: ASCOT as a globally recognized comprehensive inclusive higher education institution anchoring on the local culture of Aurora in particular and the Philippines in general.",
        mission:
          "ASCOT shall capacitate human resources of Aurora and beyond to be globally empowered and future-proofed; generate, disseminate, and apply knowledge and technologies for sustainable development.",
        goals: `To adopt gender mainstreaming as a strategy to promote women's rights and eliminate gender 
                discrimination in their systems, structure, policies, programs, processes, and procedures.`,
        objectives: [
          "To pursue advocacy on gender equality and empowerment",
          "To promote gender-responsive curriculum, research and development, and extension services",
          "To capacitate GFPS and stakeholders",
          "To build governance and linkages",
        ],
      });
    }, 1000); // Simulate a 1-second delay
  }, []);
  if (!vmgoData) {
    return (
      <div
        style={{
          textAlign: "center",
          fontSize: "24px",
          padding: "20px",
          color: "#004AAD",
        }}
      >
        Loading...
      </div>
    );
  }
  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "50px auto",
        padding: "40px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #E0EAFD, #D1D8F8)",
        color: "#2E3A59",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        fontFamily: "Arial, sans-serif",
        position: "relative",
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#004AAD",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        }}
      >
        Back
      </button>
      {/* Header Section with Logos */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "30px",
          gap: "20px",
        }}
      >
        <img
          src="/logo/ascot.png"
          alt="Logo 1"
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          }}
        />
        <h2
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#004AAD",
            textShadow: "1px 1px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          ASCOT-GAD VMGO
        </h2>
        <img
          src="/logo/gad.png"
          alt="Logo 2"
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          }}
        />
      </div>
      {/* Vision Section */}
      <div
        style={{
          textAlign: "left",
          marginBottom: "30px",
          padding: "20px",
          borderRadius: "15px",
          background: "#ffffff",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "22px",
            marginBottom: "10px",
            color: "#004AAD",
            borderBottom: "3px solid #FFD700",
          }}
        >
          Vision
        </h3>
        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.8",
            margin: "10px 0",
          }}
        >
          {vmgoData.vision}
        </p>
      </div>
      {/* Mission Section */}
      <div
        style={{
          textAlign: "left",
          marginBottom: "30px",
          padding: "20px",
          borderRadius: "15px",
          background: "#ffffff",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "22px",
            marginBottom: "10px",
            color: "#004AAD",
            borderBottom: "3px solid #FFD700",
          }}
        >
          Mission
        </h3>
        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.8",
            margin: "10px 0",
          }}
        >
          {vmgoData.mission}
        </p>
      </div>
      {/* Goals Section */}
      <div
        style={{
          textAlign: "left",
          marginBottom: "30px",
          padding: "20px",
          borderRadius: "15px",
          background: "#ffffff",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "22px",
            marginBottom: "10px",
            color: "#004AAD",
            borderBottom: "3px solid #FFD700",
          }}
        >
          Goals
        </h3>
        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.8",
            margin: "10px 0",
          }}
        >
          {vmgoData.goals}
        </p>
      </div>
      {/* Objectives Section */}
      <div
        style={{
          textAlign: "left",
          marginBottom: "30px",
          padding: "20px",
          borderRadius: "15px",
          background: "#ffffff",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "22px",
            marginBottom: "10px",
            color: "#004AAD",
            borderBottom: "3px solid #FFD700",
          }}
        >
          Objectives
        </h3>
        <ul
          style={{
            fontSize: "16px",
            lineHeight: "1.8",
            listStyleType: "none",
            paddingLeft: "0",
            margin: "10px 0",
          }}
        >
          {vmgoData.objectives.map((objective, index) => (
            <li key={index} style={{ marginBottom: "10px" }}>
              • {objective}
            </li>
          ))}
        </ul>
      </div>
      {/* Footer Section */}
      <div
        style={{
          borderTop: "2px solid #004AAD",
          paddingTop: "20px",
          fontSize: "16px",
          color: "#004AAD",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        <p>AURORA STATE COLLEGE OF TECHNOLOGY, GENDER AND DEVELOPMENT</p>
      </div>
    </div>
  );
};
export default VMGO;
