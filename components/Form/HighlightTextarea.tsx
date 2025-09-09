import React from "react";

interface HighlightTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  active: boolean;
}

export const HighlightTextarea: React.FC<HighlightTextareaProps> = ({
  value,
  onChange,
  placeholder,
  active,
}) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={
      "flex-1 rounded-xl p-3 focus:outline-none focus:border-gray-300 appearance-none resize-none " +
      (active ? "border-none" : "border border-gray-300")
    }
    style={
      active
        ? { boxShadow: "none", outline: "none" }
        : { borderTop: "1px solid #d1d5db", boxShadow: "none", outline: "none" }
    }
  />
);
