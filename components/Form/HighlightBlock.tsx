import React from "react";

interface HighlightBlockProps {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}

export const HighlightBlock: React.FC<HighlightBlockProps> = ({
  active,
  children,
  className = "",
}) => (
  <div
    className={
      (active
        ? "ring-2 ring-blue-400/60 shadow-lg shadow-blue-100/40 bg-gradient-to-l from-blue-50/80 to-transparent border-r-4 p-4 border-blue-400 "
        : "") +
      "rounded-xl transition-all duration-300 " +
      className
    }
  >
    {children}
  </div>
);
