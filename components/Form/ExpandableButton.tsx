import { cn } from "@/lib/utils";
import React, { useState } from "react";

type ExpandableButtonProps = {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
};

const ExpandableButton: React.FC<ExpandableButtonProps> = ({
  icon,
  text,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="w-full">
      <div
        className={cn(
          "h-12 p-3 rounded-full shadow-[2px_2px_8px_0px_rgba(0,0,0,0.10)] justify-center items-center gap-1 inline-flex transition-all duration-200 cursor-pointer group", // Added cursor-pointer here
          isHovered ? "bg-neutral-100" : "bg-white",
          isActive ? "bg-gray-200" : "",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        onClick={onClick}
      >
        <div
          className={cn(
            "h-6 items-center flex overflow-hidden transition-all duration-200",
            {
              "justify-center": !isHovered, // Added justify-center for icon centering when not hovered
              "justify-start": isHovered,
            },
          )}
        >
          <div
            data-svg-wrapper
            className="relative flex justify-center items-center"
          >
            {" "}
            {/* Added flex justify-center items-center to icon wrapper */}
            {icon}
          </div>
          <div
            className={cn(
              "text-black/90 text-sm font-medium font-montserrat leading-snug overflow-hidden transition-all duration-300 text-nowrap inline-flex items-center",
              isHovered
                ? "max-w-[100px] opacity-100 pl-1"
                : "max-w-0 opacity-0",
            )}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableButton;
