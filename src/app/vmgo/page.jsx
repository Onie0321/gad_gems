"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "50px auto",
    padding: "40px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #E0EAFD, #D1D8F8)",
    color: "#2E3A59",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    fontFamily: "Arial, sans-serif",
    position: "relative",
  },
  backButton: {
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
  },
  header: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "30px",
    gap: "20px",
  },
  logo: {
    width: "80px",
    height: "80px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#004AAD",
    textShadow: "1px 1px 4px rgba(0, 0, 0, 0.3)",
  },
  section: {
    textAlign: "left",
    marginBottom: "30px",
    padding: "20px",
    borderRadius: "15px",
    background: "#ffffff",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  },
  sectionTitle: {
    fontSize: "22px",
    marginBottom: "10px",
    color: "#004AAD",
    borderBottom: "3px solid #FFD700",
  },
  content: {
    fontSize: "16px",
    lineHeight: "1.8",
    margin: "10px 0",
  },
  footer: {
    borderTop: "2px solid #004AAD",
    paddingTop: "20px",
    fontSize: "16px",
    color: "#004AAD",
    textAlign: "center",
    fontWeight: "bold",
  },
};

const VMGO = () => {
  const [vmgoData, setVmgoData] = useState({
    vision: "",
    mission: "",
    goals: "",
    objectives: [],
  });

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => {
      setVmgoData({
        vision:
          "ASCOT 2030: ASCOT as a globally recognized comprehensive inclusive higher education institution anchoring on the local culture of Aurora in particular and the Philippines in general.",
        mission:
          "ASCOT shall capacitate human resources of Aurora and beyond to be globally empowered and future-proofed; generate, disseminate, and apply knowledge and technologies for sustainable development.",
        goals:
          "To adopt gender mainstreaming as a strategy to promote women's rights and eliminate gender discrimination in their systems, structure, policies, programs, processes, and procedures.",
        objectives: [
          "To pursue advocacy on gender equality and empowerment",
          "To promote gender-responsive curriculum, research and development, and extension services",
          "To capacitate GFPS and stakeholders",
          "To build governance and linkages",
        ],
      });
    }, 1000);
  }, []);

  const Section = ({ title, content }) => (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {Array.isArray(content) ? (
        <ul style={styles.content}>
          {content.map((item, index) => (
            <li key={index} style={{ marginBottom: "10px" }}>
              • {item}
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.content}>{content}</p>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <button onClick={() => window.history.back()} style={styles.backButton}>
        Back
      </button>

      <div style={styles.header}>
        <Image src="/logo/ascot.png" alt="ASCOT Logo" width={80} height={80} style={styles.logo} />
        <h2 style={styles.title}>ASCOT-GAD VMGO</h2>
        <Image src="/logo/gad.png" alt="GAD Logo" width={80} height={80} style={styles.logo} />
      </div>

      <Section title="Vision" content={vmgoData.vision} />
      <Section title="Mission" content={vmgoData.mission} />
      <Section title="Goals" content={vmgoData.goals} />
      <Section title="Objectives" content={vmgoData.objectives} />

      <div style={styles.footer}>
        <p>AURORA STATE COLLEGE OF TECHNOLOGY, GENDER AND DEVELOPMENT</p>
      </div>
    </div>
  );
};

export default VMGO;
