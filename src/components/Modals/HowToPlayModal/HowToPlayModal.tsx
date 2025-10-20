import { useEffect } from "react";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { Carousal } from "../../common/Carousal/Carousal";
import "./HowToPlayModal.css";
import { HowToPlayScreen1 } from "./HowToPlayScreens/HowToPlayScreen1";
import { HowToPlayScreen2 } from "./HowToPlayScreens/HowToPlayScreen2";
import { HowToPlayScreen3 } from "./HowToPlayScreens/HowToPlayScreen3";
import { HowToPlayScreen4 } from "./HowToPlayScreens/HowToPlayScreen4";
import { HowToPlayScreen5 } from "./HowToPlayScreens/HowToPlayScreen5";
import { HowToPlayScreen6 } from "./HowToPlayScreens/HowToPlayScreen6";

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
          <HowToPlayScreen5 />,
          <HowToPlayScreen6 />,
        ]}
      />
    </div>
  );
};

export default HowToPlayModal;
