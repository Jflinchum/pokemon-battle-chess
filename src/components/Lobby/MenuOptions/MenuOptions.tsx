import { useRef } from "react";
import { toast } from "react-toastify";
import { Sprites } from "@pkmn/img";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChessKing,
  faCog,
  faDoorOpen,
  faFaceGrin,
  faNoteSticky,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { useModalState } from "../../../context/ModalState/ModalStateContext";
import { useUserState } from "../../../context/UserState/UserStateContext";
import PokemonOfTheDay from "../PokemonOfTheDay/PokemonOfTheDay";
import NavOptions from "../../common/NavOptions/NavOptions";
import { NavOptionButton } from "../../common/NavOptions/NavOptionButton/NavOptionButton";
import { ReplayData } from "../../BattleChessGame/BattleChessManager/GameManagerActions/downloadReplay";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { validateReplay } from "./validateReplay";
import "./MenuOptions.css";

const MenuOptions = () => {
  const { dispatch } = useModalState();
  const { userState } = useUserState();
  const { dispatch: gameStateDispatch } = useGameState();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleQuickMatchClick = () => {
    dispatch({ type: "OPEN_QUICK_MATCH_MODAL", payload: {} });
  };

  const handleCreateRoom = () => {
    dispatch({ type: "OPEN_CREATE_ROOM_MODAL", payload: {} });
  };

  const handleCustomize = () => {
    dispatch({ type: "OPEN_CUSTOMIZE_MODAL", payload: {} });
  };

  const handleHowToPlay = () => {
    dispatch({ type: "OPEN_HOW_TO_PLAY_MODAL", payload: {} });
  };

  const handleUploadReplayClick = () => {
    inputRef.current?.click();
  };

  const handleOptionsClick = () => {
    dispatch({ type: "OPEN_OPTIONS_MODAL", payload: {} });
  };

  const handleUploadReplay = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const matchReplay = JSON.parse(reader.result as string) as ReplayData;
        if (validateReplay(matchReplay)) {
          gameStateDispatch({ type: "START_REPLAY", payload: matchReplay });
        }
      } catch (err) {
        toast("Error: Unable to read replay file", { type: "error" });
        console.log(err);
      }
    };

    reader.readAsText(file);
  };

  return (
    <NavOptions>
      <div className="menuOptions">
        {userState.name && (
          <div>
            <p className="nameContainer">
              <b>Name: </b>
              <span className="username">{userState.name}</span>
            </p>
            <div className="avatarContainer">
              <img src={Sprites.getAvatar(parseInt(userState.avatarId))} />
            </div>
          </div>
        )}
        <NavOptionButton
          className="menuOptionButtonContainer"
          onClick={handleQuickMatchClick}
        >
          <FontAwesomeIcon icon={faChessKing} />
          <span>Quick Play</span>
        </NavOptionButton>
        <NavOptionButton
          className="menuOptionButtonContainer"
          onClick={handleCreateRoom}
        >
          <FontAwesomeIcon icon={faDoorOpen} />
          <span>Create New Room</span>
        </NavOptionButton>
        <NavOptionButton
          className="menuOptionButtonContainer"
          onClick={handleCustomize}
        >
          <FontAwesomeIcon icon={faFaceGrin} />
          <span>Customize</span>
        </NavOptionButton>
        <NavOptionButton
          className="menuOptionButtonContainer"
          onClick={handleHowToPlay}
        >
          <FontAwesomeIcon icon={faNoteSticky} />
          <span>How to Play</span>
        </NavOptionButton>
        <NavOptionButton
          className="menuOptionButtonContainer"
          onClick={handleUploadReplayClick}
        >
          <FontAwesomeIcon icon={faUpload} />
          <span>Watch Replay</span>
        </NavOptionButton>
        <NavOptionButton
          className="menuOptionButtonContainer"
          onClick={handleOptionsClick}
        >
          <FontAwesomeIcon icon={faCog} />
          <span>Options</span>
        </NavOptionButton>
      </div>
      <input
        type="file"
        style={{ display: "none" }}
        ref={inputRef}
        onChange={handleUploadReplay}
        accept=".replay"
      />

      <div className="pokemonOfTheDayContainer">
        <PokemonOfTheDay />
      </div>
    </NavOptions>
  );
};

export default MenuOptions;
