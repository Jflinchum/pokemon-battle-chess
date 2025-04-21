import { useRef, useState, useEffect } from "react";
import { Color, Square } from "chess.js";
import { socket } from "../../../socket";
import { EndGameReason, MatchLog, PokemonBeginBattleData } from '../../../../shared/types/game';
import { timer } from "../../../utils";
import { CurrentBattle } from "./BattleChessManager";
import { useGameState } from "../../../context/GameStateContext";
import { ArgType, KWArgType, Protocol } from "@pkmn/protocol";

interface BattleHistoryProps {
  matchHistory?: MatchLog[],
  currentBattle?: CurrentBattle | null,
  onBan: (index: number) => void,
  onDraft: (square: Square, index: number, color: Color) => void,
  onMove: (sanMove: string, moveFailed?: boolean) => void,
  onPokemonBattleStart: (p1Pokemon: PokemonBeginBattleData['p1Pokemon'], p2Pokemon: PokemonBeginBattleData['p2Pokemon'], attemptedMove: PokemonBeginBattleData['attemptedMove']) => void,
  onPokemonBattleOutput: ({ args, kwArgs }: { args: ArgType; kwArgs: KWArgType }) => void,
  onPokemonBattleEnd?: (victor: Color) => void,
  onGameEnd: (victor: Color, reason: EndGameReason) => void,
  skipToEndOfSync: boolean,
};

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
  onPokemonBattleEnd = () => {},
  onGameEnd,
  skipToEndOfSync
}: BattleHistoryProps) => {
  // User state preferred animation speed and multiply the timers here based on it TODO
  const { gameState } = useGameState();

  const [matchLog, setCurrentMatchLog] = useState(matchHistory || []);

  const matchLogIndex = useRef(0);
  const pokemonLogIndex = useRef(0);

  useEffect(() => {
    socket.on('gameOutput', (log: MatchLog) => {
      setCurrentMatchLog((curr) => [...curr, log]);
    });

    return () => {
      socket.off('gameOutput');
    };
  }, []);

  const [catchingUp, setCatchingUp] = useState(false);

  useEffect(() => {
    setCurrentMatchLog(matchHistory || matchLog);
  }, [matchHistory]);

  useEffect(() => {
    let catchUpTimer: { start: () => Promise<void>, stop: () => void } | undefined;
    // TODO: Optimization for browser DOM rendering. Instead of setting a timeout of 0 and still updating the DOM in the background, we should simulate the chess moves and battle instead, then update the DOM after.
    const timeBetweenSteps = 1000 * (skipToEndOfSync ? 0 : 1);

    // On mount, start attempting to sync to the current match
    const catchUpToCurrentState = async () => {
      while (matchLogIndex.current < matchLog.length) {
        if (matchLogIndex.current < matchLog.length - 3 && !catchingUp) {
          setCatchingUp(true);
        }

        const currentLog = matchLog[matchLogIndex.current];
        switch (currentLog.type) {
          case 'generic':
            switch (currentLog.data.event) {
              case 'gameEnd':
                onGameEnd(currentLog.data.color, currentLog.data.reason);
                matchLogIndex.current++;
            }
            break;
          case 'ban':
            onBan(currentLog.data.index);
            matchLogIndex.current++;
            catchUpTimer = timer(timeBetweenSteps);
            await catchUpTimer.start();
            break;
          case 'draft':
            const isRandomDraft = gameState.gameSettings.options.format === 'random' ? 0 : 1;
            onDraft(currentLog.data.square, currentLog.data.index, currentLog.data.color);
            matchLogIndex.current++;
            catchUpTimer = timer(timeBetweenSteps * isRandomDraft);
            await catchUpTimer.start();
            break;
          case 'chess':
            onMove(currentLog.data.san, currentLog.data.failed);
            matchLogIndex.current++;
            catchUpTimer = timer(timeBetweenSteps);
            await catchUpTimer.start();
            break;
          case 'pokemon':
            switch (currentLog.data.event) {
              case 'battleStart':
                pokemonLogIndex.current = 0;
                onPokemonBattleStart(currentLog.data.p1Pokemon, currentLog.data.p2Pokemon, currentLog.data.attemptedMove);
                matchLogIndex.current++;
                catchUpTimer = timer(timeBetweenSteps);
                await catchUpTimer.start();
                break;
              case 'streamOutput':
                const parsedChunk = Protocol.parse(currentLog.data.chunk);
                const currentPokemonLog = [];
                for (const { args, kwArgs } of parsedChunk) {
                  currentPokemonLog.push({ args, kwArgs });
                }

                while (pokemonLogIndex.current < currentPokemonLog.length) {
                  const { args, kwArgs } = currentPokemonLog[pokemonLogIndex.current];
                  onPokemonBattleOutput({ args, kwArgs });

                  pokemonLogIndex.current++;
                  if (shouldDelayBeforeContinuing(args[0])) {
                    catchUpTimer = timer(1000 * (skipToEndOfSync ? 0 : 1));
                    await catchUpTimer.start();
                  }
                }

                pokemonLogIndex.current = 0;
                matchLogIndex.current++;
                break;
              case 'victory':
                onPokemonBattleEnd(currentLog.data.color);
                matchLogIndex.current++;
                catchUpTimer = timer(timeBetweenSteps);
                await catchUpTimer.start();
                break;
            }
        }
      }

      setCatchingUp(false);
    }
  
    catchUpToCurrentState();
    
    return () => {
      catchUpTimer?.stop();
    }
  }, [currentBattle, skipToEndOfSync, matchLog]);

  return { catchingUp, currentMatchLog: matchLog.slice(0, matchLogIndex.current) };
};

const shouldDelayBeforeContinuing = (logType: string) => {
  const delayLogs = ['move', '-damage', '-heal'];
  if (delayLogs.includes(logType)) {
    return true;
  }
  return false;
}

export default useBattleHistory;