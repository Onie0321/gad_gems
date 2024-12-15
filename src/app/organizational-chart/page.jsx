"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const OrgChart = () => {
  const [selectedProfile, setSelectedProfile] = useState(null);

  const gadCoordinators = useMemo(
    () => [
      {
        name: "Jomer B. Mangawang",
        position: "Bazal",
        position2: "Campus",
        photo: "/img/jomer.jpg",
      },
      {
        name: "Kirk Joshua C. Bautista",
        position: "Arts and",
        position2: "Sciences",
        photo: "/img/kirk.jpg",
      },
      {
        name: "Jeoben A. Fontanos",
        position: "Industrial",
        position2: "Technology",
        photo: "/img/joeben.jpg",
      },
      {
        name: "Marlon G. Lingon",
        position: "Forestry and",
        position2: "Environmental Sciences",
        photo: "/img/marlon.jpg",
      },
      {
        name: "Maximo M. Marte Jr.",
        position: "Education",
        photo: "/img/maxi.jpg",
      },
      {
        name: "Dan Amiel M. Moral",
        position: "Casiguran",
        position2: "Campus",
        photo: "/img/dan.jpg",
      },
      {
        name: "Christine L. Renomeron",
        position: "Engineering",
        photo: "/img/christine.jpg",
      },
      {
        name: "Ma. Tricia C. Gelido",
        position: "Non-Academic",
        position2: "Representative",
        photo: "/img/tricia.jpg",
      },
      {
        name: "King Alvin P. Grospe",
        position: "Information Technology",

        photo: "/img/king1.png",
      },
    ],
    []
  );

  const gfpsExecutiveCoordinators = useMemo(
    () => [
      {
        name: "Engr. Oscar C. Barawid, PhD",
        position: "VP for Administration,",
        position2: "Planning, and Finance",
        photo: "/img/oscar.jpg",
      },
      {
        name: "Ma Luz F. Cabatan, PhD",
        position: "VP for Academic Affairs,",
        position2: "Dean, School of Agriculture and Aquatic Sciences",
        photo: "/img/luz.jpg",
      },
      {
        name: "Joseph T. Gonzales",
        position: "Board Secretary, Director",
        position2: "of International, External, and Alumni Services",
        photo: "/img/kid.jpg",
      },
      {
        name: "Maria Veronica M. Dulay",
        position: "Human Resource",
        position2: "Management Officer",
        photo: "/img/maria.jpg",
      },
      {
        name: "Maria Cezil A. Molina",
        position: "Director, Planning Unit,",
        position2: "BAC Chairman",
        photo: "/img/cezil.jpg",
      },
      {
        name: "Atty. Racquel Dujunco, CPA",
        position: "Dean, College of",
        position2: "Law",
        photo: "/img/attydojunco.jpg",
      },
      {
        name: "Chrystal Faye V. Salazar, CPA",
        position: "Budget Officer",
        photo: "/img/chrystal.jpg",
      },
      {
        name: "Diana Rose P. De Mesa-Amazona",
        position: "Information Officer III,",
        position2: "Disaster Risk Reduction Management Officer",
        photo: "/img/diana.png",
      },
      {
        name: "Kelvin Carl O. Miñoza",
        position: "Project Development",
        position2: "Officer III",
        photo: "/img/kelvin.png",
      },
      {
        name: "Lorna R. Babiera",
        position: "General Services",
        position2: "Officer",
        photo: "/img/lorna.jpg",
      },
      {
        name: "Alma S. Bayudan, PhD",
        position: "Director, Office of",
        position2: "Student's Affairs Services",
        photo: "/img/alma.jpg",
      },
      {
        name: "Genalyn C. Gudoy",
        position: "College Nurse",
        photo: "/img/genalyn.jpg",
      },
      {
        name: "Alking B. Gorospe, PhD",
        position: "Director, Research and",
        position2: "Development Services, Dean, School of Engineering",
        photo: "/img/alking.jpg",
      },
      {
        name: "Ricardo G. Gonzales, Jr., PhD",
        position: "Director, Extension and",
        position2: "Rural Development",
        photo: "/img/ric.jpg",
      },
      {
        name: "Rowel G. Olila, PhD",
        position: "Dean, School of",
        position2: "Education",
        photo: "/img/rowel.jpg",
      },
      {
        name: "Malou C. Angara",
        position: "Dean, School of",
        position2: "Arts and Sciences",
        photo: "/img/malou.jpg",
      },
      {
        name: "Mayreen V. Amazona, DIT",
        position: "Dean, School of",
        position2: "Information Technology",
        photo: "/img/ascotdean.jpg",
      },
      {
        name: "Annie R. Capin",
        position: "Dean, School of",
        position2: "Industrial Technology",
        photo: "/img/annie.jpg",
      },
      {
        name: "RB J. Gallego, PhD",
        position: "Dean, School of",
        position2: "Forestry and Environmental Sciences",
        photo: "/img/rb.jpg",
      },
      {
        name: "Don Sean Arvie V. Buencamino",
        position: "Dean, School of Distance",
        position2: "and Online Learning",
        photo: "/img/sean.jpg",
      },
      {
        name: "Norma T. Barbasa",
        position: "Director, NSTP",
        photo: "/img/norma.jpg",
      },
      {
        name: "Glenda M. Gines",
        position: "Director, SWK",
        photo: "/img/glenda.jpg",
      },
      {
        name: "Joshua D. Dela Cruz",
        position: "Director, Socio-Cultural",
        position2: "Office",
        photo: "/img/joshua.jpg",
      },
      {
        name: "Mark Joseph R. Rafael, PhD",
        position: "Administrator,",
        position2: "Casiguran Campus",
        photo: "/img/mark.jpg",
      },
      {
        name: "Mario B. Andres",
        position: "Chief, Security and",
        position2: "Safety Office",
        photo: "/img/mario.jpg",
      },
      {
        name: "Oliver Ian A. Abordo",
        position: "Administrator,",
        position2: "Bazal Campus",
        photo: "/img/ian.jpg",
      },
    ],
    []
  );

  const ImageModal = ({ profile, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-gradient-to-br from-purple-600/30 to-blue-400/30 p-6 rounded-2xl shadow-lg max-w-2xl max-h-[90vh] flex flex-col items-center backdrop-blur-md border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-64 h-64 mb-4 rounded-full overflow-hidden border-4 border-white/50 shadow-inner shadow-white/30">
          <Image
            src={profile.photo}
            alt={profile.name}
            layout="fill"
            objectFit="cover"
            className="rounded-full"
          />
        </div>
        <h2 className="text-2xl font-bold text-center mb-2 break-words max-w-full text-white">
          {profile.name}
        </h2>
        <p className="text-lg text-gray-200 text-center">{profile.position}</p>
        {profile.position2 && (
          <p className="text-lg text-gray-200 text-center">
            {profile.position2}
          </p>
        )}
      </motion.div>
    </motion.div>
  );

  const CircularImage = ({ profile, size }) => (
    <motion.div
      whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(255,255,255,0.5)" }}
      whileTap={{ scale: 0.9 }}
      className={`relative rounded-full overflow-hidden cursor-pointer border-2 border-white/50`}
      style={{ width: size, height: size }}
      onClick={() => setSelectedProfile(profile)}
    >
      <Image
        src={profile.photo}
        alt={profile.name}
        layout="fill"
        objectFit="cover"
        className="transition-transform duration-300 ease-in-out transform hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-blue-400/50 opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );

  return (
    <>
      <svg
        width="90%"
        height="100%"
        viewBox="0 0 1200 5000"
        preserveAspectRatio="xMidYMid meet"
        className="text-white"
      >
        {/* Futuristic background */}
        <defs>
          <radialGradient
            id="bg-gradient"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.1)" />
            <stop offset="50%" stopColor="rgba(79, 70, 229, 0.1)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-gradient)" />

        {/* Connecting lines */}
        <g className="connecting-lines" filter="url(#glow)">
          <line
            x1="600"
            y1="275"
            x2="600"
            y2="316"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <line
            x1="260"
            y1="370"
            x2="560"
            y2="370"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <line
            x1="640"
            y1="370"
            x2="950"
            y2="370"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <line
            x1="600"
            y1="490"
            x2="600"
            y2="555"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
        </g>

        {/* Title */}
        <text
          x="600"
          y="30"
          textAnchor="middle"
          fontSize="26"
          fontWeight="bold"
          fill="white"
          className="uppercase tracking-wide"
          filter="url(#glow)"
        >
          GENDER AND DEVELOPMENT ORGANIZATIONAL CHART
        </text>

        {/* President */}
        <g transform="translate(600, 120)">
          <foreignObject x="-50" y="-10" width="100" height="100">
            <CircularImage
              profile={{
                name: "RENATO G. REYES, PhD",
                position: "SUC PRESIDENT II",
                position2: "Chair, GFPS Executive Committee",
                photo: "/img/presrenato.jpg",
              }}
              size={100}
            />
          </foreignObject>
          <text
            x="0"
            y="110"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="white"
          >
            RENATO G. REYES, PhD
          </text>
          <text x="0" y="130" textAnchor="middle" fontSize="12" fill="white">
            SUC PRESIDENT II
          </text>
          <text
            x="0"
            y="150"
            textAnchor="middle"
            fontSize="12"
            fill="rgba(255,255,255,0.7)"
          >
            Chair, GFPS Executive Committee
          </text>
        </g>

        {/* GAD Director */}
        <g transform="translate(600, 330)">
          <foreignObject x="-50" y="-10" width="100" height="100">
            <CircularImage
              profile={{
                name: "AMPARO ROBERTA A. ESPINOSA",
                position: "Director, Gender and Development",
                position2: "Chair, GAD Technical Working Group",
                photo: "/img/amparo.jpg",
              }}
              size={100}
            />
          </foreignObject>
          <text
            x="0"
            y="110"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="white"
          >
            AMPARO ROBERTA A. ESPINOSA
          </text>
          <text x="0" y="130" textAnchor="middle" fontSize="12" fill="white">
            Director, Gender and Development
          </text>
          <text
            x="0"
            y="150"
            textAnchor="middle"
            fontSize="12"
            fill="rgba(255,255,255,0.7)"
          >
            Chair, GAD Technical Working Group
          </text>
        </g>

        {/* GFPS Executive Coordinators */}
        <g transform="translate(100, 330)">
          <text
            x="120"
            y="-10"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="white"
          >
            GFPS EXECUTIVE COORDINATORS
          </text>
          {gfpsExecutiveCoordinators.map((member, index) => (
            <g key={index} transform={`translate(0, ${index * 180})`}>
              <foreignObject x="80" y="20" width="80" height="80">
                <CircularImage profile={member} size={80} />
              </foreignObject>
              <text
                x="120"
                y="120"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="white"
              >
                {member.name}
              </text>
              <text
                x="120"
                y="140"
                textAnchor="middle"
                fontSize="12"
                fill="rgba(255,255,255,0.7)"
              >
                {member.position}
              </text>
              {member.position2 && (
                <text
                  x="120"
                  y="160"
                  textAnchor="middle"
                  fontSize="12"
                  fill="rgba(255,255,255,0.7)"
                >
                  {member.position2}
                </text>
              )}
            </g>
          ))}
        </g>

        {/* GAD Secretariat */}
        <g transform="translate(1100, 310)">
          <text
            x="-140"
            y="10"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="white"
          >
            GAD SECRETARIAT
          </text>
          <g transform="translate(0, 50)">
            <foreignObject x="-180" y="-10" width="80" height="80">
              <CircularImage
                profile={{
                  name: "Arnold Monteverde",
                  position: "GAD",
                  position2: "Secretariat",
                  photo: "/img/arnold.jpg",
                }}
                size={80}
              />
            </foreignObject>
            <text
              x="-140"
              y="90"
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="white"
            >
              Arnold Monteverde
            </text>
            <text
              x="-140"
              y="110"
              textAnchor="middle"
              fontSize="12"
              fill="rgba(255,255,255,0.7)"
            >
              GAD Secretariat
            </text>
          </g>
        </g>

        {/* GAD Coordinators */}
        <g transform="translate(600, 580)">
          <text
            x="0"
            y="-10"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="white"
          >
            GAD COORDINATORS
          </text>
          {gadCoordinators.map((coordinator, index) => (
            <g key={index} transform={`translate(0, ${index * 200})`}>
              <foreignObject x="-40" y="20" width="80" height="80">
                <CircularImage profile={coordinator} size={80} />
              </foreignObject>
              <text
                x="0"
                y="120"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="white"
              >
                {coordinator.name}
              </text>
              <text
                x="0"
                y="140"
                textAnchor="middle"
                fontSize="12"
                fill="rgba(255,255,255,0.7)"
              >
                {coordinator.position}
              </text>
              {coordinator.position2 && (
                <text
                  x="0"
                  y="160"
                  textAnchor="middle"
                  fontSize="12"
                  fill="rgba(255,255,255,0.7)"
                >
                  {coordinator.position2}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
      <AnimatePresence>
        {selectedProfile && (
          <ImageModal
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const ScrollButtons = () => {
  const [showTopButton, setShowTopButton] = useState(false);
  const [showBottomButton, setShowBottomButton] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      setShowTopButton(scrollTop > 100);
      setShowBottomButton(scrollTop + clientHeight < scrollHeight - 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed right-4 bottom-4 flex flex-col gap-2">
      {showTopButton && (
        <Button
          onClick={scrollToTop}
          variant="outline"
          size="icon"
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
      {showBottomButton && (
        <Button
          onClick={scrollToBottom}
          variant="outline"
          size="icon"
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default function Component() {
  return (
    <div className="w-full h-full flex justify-center items-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6 relative overflow-auto">
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 right-4 text-4xl text-white hover:text-purple-400 transition-colors duration-200 focus:outline-none"
        aria-label="Go back"
      >
        ×
      </button>
      <OrgChart />
      <ScrollButtons />
    </div>
  );
}
