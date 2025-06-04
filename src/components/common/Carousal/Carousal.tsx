import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Button from "../Button/Button";
import "./Carousal.css";

interface CarousalProps {
  screens: React.ReactNode[];
  className?: string;
}

export const Carousal = ({ screens, className = "" }: CarousalProps) => {
  const [screenIndex, setScreenIndex] = useState(0);

  return (
    <div className={`carousal ${className}`}>
      <div className="carousalItems">
        {screens.map(
          (screen, index) =>
            index === screenIndex && <div key={index}>{screen}</div>,
        )}
      </div>
      <div className="carousalActions">
        <Button
          color="primary"
          onClick={() =>
            setScreenIndex((curr) =>
              curr - 1 < 0 ? screens.length - 1 : --curr,
            )
          }
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </Button>
        <Button
          color="primary"
          onClick={() =>
            setScreenIndex((curr) => (curr + 1 >= screens.length ? 0 : ++curr))
          }
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </Button>
      </div>
    </div>
  );
};
