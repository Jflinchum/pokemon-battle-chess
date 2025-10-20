import { ArgType, KWArgType, Protocol } from "@pkmn/protocol";
import { Color, Square } from "chess.js";
import { useEffect, useState } from "react";
import { SquareModifier } from "../../../../shared/models/PokemonBattleChessManager";
import {
  EndGameReason,
  MatchLog,
  PokemonBeginBattleData,
} from "../../../../shared/types/Game.js";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { useUserState } from "../../../context/UserState/UserStateContext";
import { socket } from "../../../socket";
import { timer } from "../../../utils";
import { CurrentBattle } from "./BattleChessManager";

interface BattleHistoryProps {
  matchHistory?: MatchLog[];
  currentBattle?: CurrentBattle | null;
  onBan: (index: number) => void;
  onDraft: (square: Square, index: number, color: Color) => void;
  onMove: ({
    sanMove,
    moveFailed,
  }: {
    sanMove: string;
    moveFailed?: boolean;
  }) => Error | undefined;
  onPokemonBattleStart: (
    p1Pokemon: PokemonBeginBattleData["p1Pokemon"],
    p2Pokemon: PokemonBeginBattleData["p2Pokemon"],
    attemptedMove: PokemonBeginBattleData["attemptedMove"],
  ) => void;
  onPokemonBattleOutput: ({
    args,
    kwArgs,
  }: {
    args: ArgType;
    kwArgs: KWArgType;
  }) => void;
  onPokemonBattleEnd?: (victor: Color) => void;
  onWeatherChange?: (squareModifiers: SquareModifier[]) => void;
  onWeatherRemove?: (square: Square[]) => void;
  onGameEnd: (victor: Color | "", reason: EndGameReason) => void;
  skipToEndOfSync: boolean;
  matchLogIndex: React.RefObject<number>;
}

/**
 * In order to sync spectators or re-sync active players, we build an active tape of the order of each phase
 * - Ban phase -- array of pokemon bans (the index of the pokemon generated)
 * - Draft phase -- array of the player color, pokemon index, and the drafted square
 * - Chess phase -- array of chess moves in SAN
 * - Pokemon Battle phase -- 2D array of pokemon battle logs for each battle that happened
 *
 * Each tape has an index for the current state that we're in for that tape. It's designed this way for the following reasons:
 * - Spectators can catch up to a battle that's already in progress
 * - Players can simulate all moves and catch up to a battle that they disconnected from
 * - If a player misses a packet, they can re-sync with the server and play out the moves that they missed
 * - Future replay systems can build off of it and fast-forward/rewind/etc.
 */
const useBattleHistory = ({
  matchHistory,
  currentBattle,
  onBan,
  onDraft,
  onMove,
  onPokemonBattleStart,
  onPokemonBattleOutput,
  onPokemonBattleEnd,
  onWeatherRemove,
  onWeatherChange,
  onGameEnd,
  skipToEndOfSync,
  matchLogIndex,
}: BattleHistoryProps) => {
  const { userState } = useUserState();
  const { gameState, dispatch } = useGameState();

  const [currentMatchLog, setCurrentMatchLog] = useState(matchHistory || []);

  useEffect(() => {
    socket.on("gameOutput", (log, ack) => {
      setCurrentMatchLog((curr) => [...curr, log]);
      ack();
    });

    return () => {
      socket.off("gameOutput");
    };
  }, []);

  useEffect(() => {
    // Stop listening for gameOutput once the match has ended
    if (gameState.matchEnded) {
      socket.off("gameOutput");
    }
  }, [gameState.matchEnded]);

  /**
   * If we receive new match history from the server in an attempt to re-sync the user,
   * then update our current state
   */
  useEffect(() => {
    if (matchHistory) {
      setCurrentMatchLog(matchHistory);
    }
  }, [matchHistory]);

  useEffect(() => {
    dispatch({ type: "SET_MATCH_HISTORY", payload: currentMatchLog });
  }, [currentMatchLog, dispatch]);

  useEffect(() => {
    let catchUpTimer:
      | { start: () => Promise<void>; stop: () => void }
      | undefined;
    // TODO: Optimization for browser DOM rendering. Instead of setting a timeout of 0 and still updating the DOM in the background, we should simulate the chess moves and battle instead, then update the DOM after.
    const timeBetweenSteps =
      userState.animationSpeedPreference * (skipToEndOfSync ? 0 : 1);

    // On mount, start attempting to sync to the current match
    const catchUpToCurrentState = async () => {
      while (matchLogIndex.current < currentMatchLog.length) {
        if (
          matchLogIndex.current < currentMatchLog.length - 3 &&
          !gameState.isCatchingUp
        ) {
          dispatch({ type: "SET_CATCHING_UP", payload: true });
        } else if (matchLogIndex.current >= currentMatchLog.length - 3) {
          dispatch({ type: "SET_CATCHING_UP", payload: false });
        }

        const currentLog = currentMatchLog[matchLogIndex.current];
        console.log(currentLog);

        /**
         * Hold off on processing chess moves while a battle is still
         * in progress so that battle animations can continue playing out.
         * Current Battle gets reset from PokemonBattleManager
         */
        if (!skipToEndOfSync && currentBattle && currentLog.type === "chess") {
          break;
        }

        switch (currentLog.type) {
          case "generic":
            switch (currentLog.data.event) {
              case "gameEnd":
                onGameEnd(currentLog.data.color, currentLog.data.reason);
                matchLogIndex.current++;
            }
            break;
          case "ban":
            onBan(currentLog.data.index);
            matchLogIndex.current++;
            catchUpTimer = timer(timeBetweenSteps);
            await catchUpTimer.start();
            break;
          case "draft": {
            const isRandomDraft =
              gameState.gameSettings.options.format === "random" ? 0 : 1;
            onDraft(
              currentLog.data.square,
              currentLog.data.index,
              currentLog.data.color,
            );
            matchLogIndex.current++;
            catchUpTimer = timer(timeBetweenSteps * isRandomDraft);
            await catchUpTimer.start();
            break;
          }
          case "chess": {
            const err = onMove({
              sanMove: currentLog.data.san,
              moveFailed: currentLog.data.failed,
            });
            matchLogIndex.current++;
            if (!err) {
              catchUpTimer = timer(timeBetweenSteps);
              await catchUpTimer.start();
            }
            break;
          }
          case "pokemon":
            switch (currentLog.data.event) {
              case "battleStart":
                onPokemonBattleStart(
                  currentLog.data.p1Pokemon,
                  currentLog.data.p2Pokemon,
                  currentLog.data.attemptedMove,
                );
                matchLogIndex.current++;
                catchUpTimer = timer(timeBetweenSteps);
                await catchUpTimer.start();
                break;
              case "streamOutput": {
                const parsedChunk = Protocol.parse(currentLog.data.chunk);
                const currentPokemonLog = [];
                for (const { args, kwArgs } of parsedChunk) {
                  currentPokemonLog.push({ args, kwArgs });
                  onPokemonBattleOutput({ args, kwArgs });
                }

                matchLogIndex.current++;
                break;
              }
              case "victory":
                onPokemonBattleEnd?.(currentLog.data.color);
                matchLogIndex.current++;
                break;
            }
            break;
          case "weather":
            switch (currentLog.data.event) {
              case "weatherChange":
                if (currentLog.data.modifier.type === "remove") {
                  onWeatherRemove?.(currentLog.data.modifier.squares);
                } else if (currentLog.data.modifier.type === "modify") {
                  onWeatherChange?.(currentLog.data.modifier.squareModifiers);
                }
                matchLogIndex.current++;
                break;
            }
        }
      }
    };

    if (
      matchLogIndex.current >= currentMatchLog.length ||
      currentMatchLog.length === 0
    ) {
      if (skipToEndOfSync) {
        dispatch({ type: "SET_SKIPPING_AHEAD", payload: false });
      }
      dispatch({ type: "SET_CATCHING_UP", payload: false });
    }

    catchUpToCurrentState();

    return () => {
      catchUpTimer?.stop();
    };
  }, [
    currentBattle,
    skipToEndOfSync,
    currentMatchLog,
    userState.animationSpeedPreference,
    gameState.gameSettings.options.format,
    onBan,
    onDraft,
    onGameEnd,
    onMove,
    onPokemonBattleEnd,
    onPokemonBattleOutput,
    onPokemonBattleStart,
    onWeatherRemove,
    onWeatherChange,
    matchLogIndex,
    dispatch,
    gameState.isCatchingUp,
  ]);

  return {
    currentMatchLog: currentMatchLog.slice(0, matchLogIndex.current),
  };
};

export default useBattleHistory;
