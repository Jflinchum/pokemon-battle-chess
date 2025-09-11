import { useEffect } from "react";
import { Carousal } from "../../../Carousal/Carousal";
import { useGameState } from "../../../../../context/GameState/GameStateContext";
import { HowToPlayScreen1 } from "./HowToPlayScreens/HowToPlayScreen1";
import { HowToPlayScreen2 } from "./HowToPlayScreens/HowToPlayScreen2";
import { HowToPlayScreen3 } from "./HowToPlayScreens/HowToPlayScreen3";
import { HowToPlayScreen4 } from "./HowToPlayScreens/HowToPlayScreen4";
import "./HowToPlayModal.css";

const HowToPlayModal = () => {
  const { dispatch } = useGameState();
  useEffect(() => {
    let mounted;
    if (!mounted) {
      mounted = true;
      dispatch({ type: "START_DEMO" });
    }

    return () => {
      mounted = false;
      dispatch({ type: "RESET_ROOM" });
    };
  }, [dispatch]);
  return (
    <div className="howToPlayModalContainer">
      <h2 className="howToPlayTitle">How To Play</h2>
      <Carousal
        className="howToPlayCarousal"
        screens={[
          <HowToPlayScreen1 />,
          <HowToPlayScreen2 />,
          <HowToPlayScreen3 />,
          <HowToPlayScreen4 />,
        ]}
      />
    </div>
  );
};

export default HowToPlayModal;
