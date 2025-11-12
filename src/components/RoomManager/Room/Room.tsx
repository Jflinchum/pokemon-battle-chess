import { Sprites } from "@pkmn/img";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { GameOptions } from "../../../../shared/types/GameOptions";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { setGameOptions as setLocalGameOptions } from "../../../util/localWebData";
import { useSocketRequests } from "../../../util/useSocketRequests";
import AnimatedBackground from "../../AnimatedBackground/AnimatedBackground";
import GameManagerActions from "../../BattleChessGame/BattleChessManager/GameManagerActions/GameManagerActions";
import Button from "../../common/Button/Button";
import Spinner from "../../common/Spinner/Spinner";
import { usePlayAgainstComputerUtil } from "../usePlayAgainstComputerUtil";
import PlayerList from "./PlayerList/PlayerList";
import PlayerName from "./PlayerName/PlayerName";
import "./Room.css";
import RoomOptions from "./RoomOptions/RoomOptions";
import { useRoomSocketEvents } from "./useRoomSocketEvents";

const Room = () => {
  const { gameState, dispatch } = useGameState();
  const [gameOptions, setGameOptions] = useState<GameOptions>(
    gameState.gameSettings.options,
  );
  const connectedPlayers = useMemo(
    () => gameState.players,
    [gameState.players],
  );

  const {
    requestStartGame,
    requestToggleSpectating,
    requestChangeGameOptions,
  } = useSocketRequests();

  useRoomSocketEvents(setGameOptions);

  const { initializeMatch, isUserInOfflineMode } = usePlayAgainstComputerUtil();

  const handleStartGame = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setLocalGameOptions(gameOptions);
      if (!isUserInOfflineMode()) {
        await requestStartGame();
      } else {
        initializeMatch(gameState.cpuDifficulty, gameOptions);
      }
    } catch (err) {
      toast(`Error: ${err}`, { type: "error" });
    }
  };

  const handleToggleSpectating = async () => {
    if (!isUserInOfflineMode()) {
      try {
        await requestToggleSpectating();
      } catch (err) {
        toast(`Error: ${err}`, { type: "error" });
      }
    } else {
      dispatch({ type: "TOGGLE_SPECTATE_CPU" });
    }
  };

  const handleRoomOptionsChange = useCallback(
    async (options: GameOptions) => {
      if (options && gameState.isHost) {
        try {
          if (!isUserInOfflineMode()) {
            await requestChangeGameOptions(options);
          }
          setGameOptions(options);
        } catch (err) {
          toast(`Error: ${err}`, { type: "error" });
        }
      }
    },
    [
      requestChangeGameOptions,
      setGameOptions,
      gameState.isHost,
      isUserInOfflineMode,
    ],
  );

  const player1 = useMemo(() => {
    return connectedPlayers.find((player) => player.isPlayer1);
  }, [connectedPlayers]);

  const player2 = useMemo(() => {
    return connectedPlayers.find((player) => player.isPlayer2);
  }, [connectedPlayers]);

  return (
    <>
      <GameManagerActions />
      <AnimatedBackground />
      <div className="roomContainer">
        <div className="roomForm">
          {connectedPlayers.length ? (
            <>
              <div className="roomPlayerContainer">
                <div className="playerContainer">
                  <div className="player">
                    {player1 ? (
                      <>
                        <img
                          alt={`Player 1 ${player1.playerName} Avatar`}
                          src={Sprites.getAvatar(player1?.avatarId || "1")}
                        />
                        <PlayerName player={player1} />
                      </>
                    ) : null}
                  </div>
                  <span>vs</span>
                  <div className="player">
                    {player2 ? (
                      <>
                        <img
                          alt={`Player 2 ${player2.playerName} Avatar`}
                          src={Sprites.getAvatar(player2?.avatarId || "1")}
                        />
                        <PlayerName player={player2} />
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="roomButtons">
                  <Button
                    disabled={
                      gameState.isSpectator
                        ? !!player1 && !!player2 && !isUserInOfflineMode()
                        : false
                    }
                    onClick={handleToggleSpectating}
                  >
                    {gameState.isSpectator
                      ? "Stop Spectating"
                      : isUserInOfflineMode()
                        ? "Spectate CPU match"
                        : "Move to Spectators"}
                  </Button>
                  <Button
                    color="primary"
                    onClick={handleStartGame}
                    disabled={
                      !gameState.isHost ||
                      !player1 ||
                      !player2 ||
                      player1?.viewingResults ||
                      player2?.viewingResults
                    }
                  >
                    Start Game
                  </Button>
                </div>

                <PlayerList players={connectedPlayers} />
              </div>
            </>
          ) : (
            <div className="roomSpinnerContainer">
              <Spinner className="roomSpinner" />
            </div>
          )}
          <hr />
          <RoomOptions
            isHost={gameState.isHost}
            gameOptions={gameOptions}
            onChange={handleRoomOptionsChange}
          />
        </div>
      </div>
    </>
  );
};

export default Room;
