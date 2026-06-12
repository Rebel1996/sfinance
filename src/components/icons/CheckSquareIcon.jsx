// src/components/icons/CheckSquareIcon.jsx
import React from "react";

export function CheckSquareIcon({ className = "w-5 h-5" }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" className="fill-green-500" />
      <path 
        d="M7.5 11.5L10.5 14.5L16.5 8.5" 
        className="stroke-white" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}