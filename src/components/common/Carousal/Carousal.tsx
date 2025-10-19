import {
  faArrowLeft,
  faArrowRight,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Button from "../Button/Button";
import "./Carousal.css";

export interface CarousalProps {
  screens: React.ReactNode[];
  wrapScreens?: boolean;
  className?: string;
}

export const Carousal = ({
  screens,
  wrapScreens,
  className = "",
}: CarousalProps) => {
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
          data-testid="carousal-previous-button"
          className="carousalArrowButtons"
          color="primary"
          disabled={!wrapScreens && screenIndex === 0}
          onClick={() => {
            if (!wrapScreens && screenIndex === 0) return;
            setScreenIndex((curr) =>
              curr - 1 < 0 ? screens.length - 1 : --curr,
            );
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </Button>
        <div className="carousalScreenSelector">
          {screens.map((_, index) => (
            <button
              onClick={() => setScreenIndex(index)}
              className={`carousalScreenSelectorItem`}
              key={index}
              aria-label={`Slide ${index + 1}`}
              data-testid="carousal-screen-selector-button"
            >
              <FontAwesomeIcon
                icon={faCircle}
                className={
                  index === screenIndex ? "carousalScreenSelectorActive" : ""
                }
              />
            </button>
          ))}
        </div>
        <Button
          data-testid="carousal-next-button"
          className="carousalArrowButtons"
          color="primary"
          disabled={!wrapScreens && screenIndex === screens.length - 1}
          onClick={() => {
            if (!wrapScreens && screenIndex === screens.length - 1) return;
            setScreenIndex((curr) => (curr + 1 >= screens.length ? 0 : ++curr));
          }}
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </Button>
      </div>
    </div>
  );
};
