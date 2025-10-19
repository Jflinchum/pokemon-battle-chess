import { PokemonSet, SideID } from "@pkmn/data";
import { Chess, Color } from "chess.js";
import { useMemo, useRef } from "react";
import { PokemonBattleChessManager } from "../../../../shared/models/PokemonBattleChessManager";
import { MatchHistory, Timer } from "../../../../shared/types/Game.js";
import { useGameState } from "../../../context/GameState/GameStateContext";
import ChatDisplay from "../../RoomManager/Chat/ChatDisplay/ChatDisplay";
import PlayerList from "../../RoomManager/Room/PlayerList/PlayerList";
import { BattleChessGame } from "./BattleChessGame";
import "./BattleChessManager.css";
import GameManagerActions from "./GameManagerActions/GameManagerActions";
import PlayerInGameDisplay from "./PlayerInGameDisplay/PlayerInGameDisplay";

export interface CurrentBattle {
  p1Pokemon: PokemonSet;
  p2Pokemon: PokemonSet;
  attemptedMove: { san: string; color: Color };
  offensivePlayer: SideID;
}

function BattleChessManager({
  matchHistory,
  timers,
}: {
  matchHistory?: MatchHistory;
  timers?: Timer;
}) {
  const { gameState } = useGameState();
  const whitePlayer = gameState.gameSettings.whitePlayer;
  const blackPlayer = gameState.gameSettings.blackPlayer;
  const chessManager = useMemo(() => {
    return new Chess();
  }, []);
  const pokemonManager = useMemo(() => {
    return new PokemonBattleChessManager({
      seed: gameState.gameSettings.seed!,
      format: gameState.gameSettings.options.format,
      weatherWars: gameState.gameSettings.options.weatherWars,
    });
  }, [
    gameState.gameSettings.seed,
    gameState.gameSettings.options.format,
    gameState.gameSettings.options.weatherWars,
  ]);

  const color = useMemo(
    () => gameState.gameSettings.color,
    [gameState.gameSettings.color],
  );

  const matchLogIndex = useRef(0);
  const topPlayer = color === "w" ? blackPlayer : whitePlayer;
  const bottomPlayer = color === "w" ? whitePlayer : blackPlayer;

  /**
   * Rendering the three different states of the game
   * - Draft/ban phase
   * - Chess phase
   * - Pokemon battle phase
   */
  return (
    <div className="battleChessAndActionContainer">
      <GameManagerActions />
      <div className="battleChessContainer">
        <PlayerInGameDisplay
          playerName={topPlayer?.playerName}
          playerAvatarId={topPlayer?.avatarId}
          connectionIssues={
            gameState.players.find(
              (player) => player.playerId === topPlayer?.playerId,
            )?.transient
          }
          takenChessPieces={pokemonManager.getTakenChessPieces(
            gameState.gameSettings.color === "w" ? "w" : "b",
          )}
          timer={color === "w" ? timers?.black : timers?.white}
          className="topPlayerDisplay"
        />
        <BattleChessGame
          pokemonManager={pokemonManager}
          chessManager={chessManager}
          matchHistory={matchHistory}
          matchLogIndex={matchLogIndex}
          color={color || "w"}
          draftMode={gameState.gameSettings.options.format === "draft"}
        />
        <PlayerInGameDisplay
          playerName={bottomPlayer?.playerName}
          playerAvatarId={bottomPlayer?.avatarId}
          connectionIssues={
            gameState.players.find(
              (player) => player.playerId === bottomPlayer?.playerId,
            )?.transient
          }
          takenChessPieces={pokemonManager.getTakenChessPieces(
            gameState.gameSettings.color === "w" ? "b" : "w",
          )}
          timer={color === "w" ? timers?.white : timers?.black}
          className="bottomPlayerDisplay"
        />

        <div className="playerAndChatContainer">
          <PlayerList
            players={gameState.players}
            className="battleChessPlayerList"
          />
          <div className="inGameChatContainer">
            <span className="inGameChatHeader">Chat</span>
            <ChatDisplay className="inGameChat" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BattleChessManager;
