import { Fragment } from "react";

const StylizedText = ({ text }: { text: string }) => {
  const boldParts = text.split(/\*\*(.+?)\*\*/);

  return (
    <span>
      {boldParts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index}>{part}</strong>;
        } else {
          return <Fragment key={index}>{part}</Fragment>;
        }
      })}
    </span>
  );
};

export default StylizedText;
