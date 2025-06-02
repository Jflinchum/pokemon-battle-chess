import { useMemo, useRef } from "react";
import { Color, Chess } from "chess.js";
import { PokemonSet, SideID } from "@pkmn/data";
import PlayerInGameDisplay from "./PlayerInGameDisplay/PlayerInGameDisplay";
import { MatchHistory, Timer } from "../../../../shared/types/game";
import GameManagerActions from "./GameManagerActions/GameManagerActions";
import PlayerList from "../../RoomManager/Room/PlayerList/PlayerList";
import { BattleChessGame } from "./BattleChessGame";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { PokemonBattleChessManager } from "../../../../shared/models/PokemonBattleChessManager";
import "./BattleChessManager.css";

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
  const pokemonLogIndex = useRef(0);

  /**
   * Rendering the three different states of the game
   * - Draft/ban phase
   * - Chess phase
   * - Pokemon battle phase
   */
  return (
    <>
      <div className="battleChessAndActionContainer">
        <GameManagerActions />
        <div className="battleChessContainer">
          <PlayerInGameDisplay
            player={color === "w" ? blackPlayer : whitePlayer}
            takenChessPieces={pokemonManager.getTakenChessPieces(
              gameState.gameSettings.color === "w" ? "w" : "b",
            )}
            timer={color === "w" ? timers?.black : timers?.white}
          />
          <BattleChessGame
            pokemonManager={pokemonManager}
            chessManager={chessManager}
            matchHistory={matchHistory}
            matchLogIndex={matchLogIndex}
            pokemonLogIndex={pokemonLogIndex}
            color={color || "w"}
          />
          <PlayerInGameDisplay
            player={color === "w" ? whitePlayer : blackPlayer}
            takenChessPieces={pokemonManager.getTakenChessPieces(
              gameState.gameSettings.color === "w" ? "b" : "w",
            )}
            timer={color === "w" ? timers?.white : timers?.black}
          />

          <PlayerList
            players={gameState.players}
            className="battleChessPlayerList"
          />
        </div>
      </div>
    </>
  );
}

export default BattleChessManager;
