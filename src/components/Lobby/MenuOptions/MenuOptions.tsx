import {
  faCertificate,
  faChessKing,
  faCog,
  faComputer,
  faDoorOpen,
  faFaceGrin,
  faNoteSticky,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Sprites } from "@pkmn/img";
import { useRef } from "react";
import { toast } from "react-toastify";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { useModalState } from "../../../context/ModalState/ModalStateContext";
import { useUserState } from "../../../context/UserState/UserStateContext";
import { logToService } from "../../../service/lobby";
import { isDevCookieEnabled } from "../../../util/devUtil";
import { ReplayData } from "../../../util/downloadReplay";
import {
  COULD_NOT_READ_REPLAY_ERROR,
  INVALID_REPLAY_ERROR,
} from "../../../util/errorMessages";
import { offlineRoomId } from "../../../util/offlineUtil";
import { NavOptionButton } from "../../common/NavOptions/NavOptionButton/NavOptionButton";
import NavOptions from "../../common/NavOptions/NavOptions";
import PokemonOfTheDay from "../PokemonOfTheDay/PokemonOfTheDay";
import "./MenuOptions.css";
import { validateReplay } from "./validateReplay";

const MenuOptions = () => {
  const { dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
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

  const handleCreditsClick = () => {
    dispatch({ type: "OPEN_CREDITS_MODAL", payload: {} });
  };

  const handlePlayBotClick = () => {
    logToService(`${userState.name} is playing against a CPU`);
    gameStateDispatch({
      type: "CREATE_ROOM",
      payload: {
        offline: true,
        playerName: userState.name,
        playerId: userState.id,
        avatarId: userState.avatarId,
      },
    });
    userStateDispatch({
      type: "JOIN_ROOM",
      payload: { roomId: offlineRoomId, roomCode: "" },
    });
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
        } else {
          toast(INVALID_REPLAY_ERROR, { type: "error" });
        }
      } catch (err) {
        toast(COULD_NOT_READ_REPLAY_ERROR, { type: "error" });
        console.log(err);
      }
    };

    reader.readAsText(file);
  };

  return (
    <NavOptions>
      <div className="menuOptions">
        {userState.name && userState.avatarId && (
          <div>
            <p className="nameContainer">
              <b>Name: </b>
              <span className="username" data-testid="menu-option-username">
                {userState.name}
              </span>
            </p>
            <div className="avatarContainer">
              <img
                data-testid="menu-option-avatar"
                src={Sprites.getAvatar(parseInt(userState.avatarId))}
                alt="Player avatar character"
              />
            </div>
          </div>
        )}
        <NavOptionButton
          aria-describedby="playBots"
          className="menuOptionButtonContainer"
          onClick={handlePlayBotClick}
          data-testid="menu-option-play-bots"
        >
          <FontAwesomeIcon icon={faComputer} />
          <span id="playBots">Play Against Computer</span>
        </NavOptionButton>
        {isDevCookieEnabled() ? (
          /**
           * Disabling this feature momentarily until matchmaking becomes a useful community feature.
           * There's too many buttons on the left nav, so we should reduce the amount of actions there
           */
          <NavOptionButton
            aria-describedby="quickPlay"
            className="menuOptionButtonContainer"
            onClick={handleQuickMatchClick}
            data-testid="menu-option-quick-play"
          >
            <FontAwesomeIcon icon={faChessKing} />
            <span id="quickPlay">Quick Play</span>
          </NavOptionButton>
        ) : null}
        <NavOptionButton
          aria-describedby="createNewRoom"
          className="menuOptionButtonContainer"
          onClick={handleCreateRoom}
          data-testid="menu-option-create-new-room"
        >
          <FontAwesomeIcon icon={faDoorOpen} />
          <span id="createNewRoom">Create New Room</span>
        </NavOptionButton>
        <NavOptionButton
          aria-describedby="customize"
          className="menuOptionButtonContainer"
          onClick={handleCustomize}
          data-testid="menu-option-customize"
        >
          <FontAwesomeIcon icon={faFaceGrin} />
          <span id="customize">Customize</span>
        </NavOptionButton>
        <NavOptionButton
          aria-describedby="howToPlay"
          className="menuOptionButtonContainer"
          onClick={handleHowToPlay}
          data-testid="menu-option-how-to-play"
        >
          <FontAwesomeIcon icon={faNoteSticky} />
          <span id="howToPlay">How to Play</span>
        </NavOptionButton>
        <NavOptionButton
          aria-describedby="watchReplay"
          className="menuOptionButtonContainer"
          onClick={handleUploadReplayClick}
          data-testid="menu-option-watch-replay"
        >
          <FontAwesomeIcon icon={faUpload} />
          <span id="watchReplay">Watch Replay</span>
        </NavOptionButton>
        <NavOptionButton
          aria-describedby="gameOptions"
          className="menuOptionButtonContainer"
          onClick={handleOptionsClick}
          data-testid="menu-option-options"
        >
          <FontAwesomeIcon icon={faCog} />
          <span id="gameOptions">Options</span>
        </NavOptionButton>
        <NavOptionButton
          aria-describedby="credits"
          className="menuOptionButtonContainer"
          onClick={handleCreditsClick}
          data-testid="menu-option-credits"
        >
          <FontAwesomeIcon icon={faCertificate} />
          <span id="credits">Credits</span>
        </NavOptionButton>
      </div>
      <input
        type="file"
        style={{ display: "none" }}
        ref={inputRef}
        onChange={handleUploadReplay}
        accept=".replay"
        data-testid="menu-option-replay-upload-input"
      />

      <div className="pokemonOfTheDayContainer" data-testid="menu-option-potd">
        <PokemonOfTheDay />
      </div>
    </NavOptions>
  );
};

export default MenuOptions;
