import { useState, useEffect } from "react";
import { Color, Square } from "chess.js";
import { ArgType, KWArgType, Protocol } from "@pkmn/protocol";
import { socket } from "../../../socket";
import {
  EndGameReason,
  MatchLog,
  PokemonBeginBattleData,
} from "../../../../shared/types/game";
import { timer } from "../../../utils";
import { CurrentBattle } from "./BattleChessManager";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { useUserState } from "../../../context/UserState/UserStateContext";
import { SquareModifier } from "../../../../shared/models/PokemonBattleChessManager";

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
  }) => Error | void;
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
  onGameEnd: (victor: Color | "", reason: EndGameReason) => void;
  skipToEndOfSync: boolean;
  matchLogIndex: React.RefObject<number>;
  pokemonLogIndex: React.RefObject<number>;
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
  onWeatherChange,
  onGameEnd,
  skipToEndOfSync,
  matchLogIndex,
  pokemonLogIndex,
}: BattleHistoryProps) => {
  const { userState } = useUserState();
  const { gameState, dispatch } = useGameState();

  const [matchLog, setCurrentMatchLog] = useState(matchHistory || []);

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

  const [catchingUp, setCatchingUp] = useState(false);

  useEffect(() => {
    if (matchHistory) {
      setCurrentMatchLog(matchHistory);
    }
  }, [matchHistory]);

  useEffect(() => {
    dispatch({ type: "SET_MATCH_HISTORY", payload: matchLog });
  }, [matchLog, dispatch]);

  useEffect(() => {
    let catchUpTimer:
      | { start: () => Promise<void>; stop: () => void }
      | undefined;
    // TODO: Optimization for browser DOM rendering. Instead of setting a timeout of 0 and still updating the DOM in the background, we should simulate the chess moves and battle instead, then update the DOM after.
    const timeBetweenSteps =
      userState.animationSpeedPreference * (skipToEndOfSync ? 0 : 1);

    // On mount, start attempting to sync to the current match
    const catchUpToCurrentState = async () => {
      while (matchLogIndex.current < matchLog.length) {
        if (matchLogIndex.current < matchLog.length - 3 && !catchingUp) {
          setCatchingUp(true);
        }

        const currentLog = matchLog[matchLogIndex.current];
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
                pokemonLogIndex.current = 0;
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
                }

                while (pokemonLogIndex.current < currentPokemonLog.length) {
                  const { args, kwArgs } =
                    currentPokemonLog[pokemonLogIndex.current];
                  onPokemonBattleOutput({ args, kwArgs });

                  pokemonLogIndex.current++;
                  if (shouldDelayBeforeContinuing(args[0])) {
                    catchUpTimer = timer(
                      timeBetweenSteps * (skipToEndOfSync ? 0 : 1),
                    );
                    await catchUpTimer.start();
                  }
                }

                pokemonLogIndex.current = 0;
                matchLogIndex.current++;
                break;
              }
              case "victory":
                catchUpTimer = timer(
                  timeBetweenSteps * (skipToEndOfSync ? 0 : 1),
                );
                await catchUpTimer.start();
                onPokemonBattleEnd?.(currentLog.data.color);
                matchLogIndex.current++;
                catchUpTimer = timer(timeBetweenSteps);
                await catchUpTimer.start();
                break;
            }
            break;
          case "weather":
            switch (currentLog.data.event) {
              case "weatherChange":
                onWeatherChange?.(currentLog.data.squareModifiers);
                matchLogIndex.current++;
                break;
            }
        }
      }

      setCatchingUp(false);
    };

    catchUpToCurrentState();

    return () => {
      catchUpTimer?.stop();
    };
  }, [
    currentBattle,
    skipToEndOfSync,
    matchLog,
    userState.animationSpeedPreference,
    catchingUp,
    gameState.gameSettings.options.format,
    onBan,
    onDraft,
    onGameEnd,
    onMove,
    onPokemonBattleEnd,
    onPokemonBattleOutput,
    onPokemonBattleStart,
    onWeatherChange,
    matchLogIndex,
    pokemonLogIndex,
  ]);

  return {
    catchingUp,
    currentMatchLog: matchLog.slice(0, matchLogIndex.current),
  };
};

const shouldDelayBeforeContinuing = (logType: string) => {
  const delayLogs = ["move", "-damage", "-heal", "-forfeit", "win"];
  if (delayLogs.includes(logType)) {
    return true;
  }
  return false;
};

export default useBattleHistory;
