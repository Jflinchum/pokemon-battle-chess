import { useRef, useState, useEffect } from "react";
import { Color, Square } from "chess.js";
import { socket } from "../../../socket";
import { MatchHistory } from "../../Room/RoomManager";
import { timer } from "../../../utils";
import { CurrentBattle } from "./BattleChessManager";
import { useGameState } from "../../../context/GameStateContext";

interface BattleHistoryProps {
  matchHistory?: MatchHistory,
  currentBattle?: CurrentBattle | null,
  onBan: (index: number) => void,
  onDraft: (square: Square, index: number, color: Color) => void,
  onMove: (sanMove: string) => boolean,
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
  skipToEndOfSync
}: BattleHistoryProps) => {
  // User state preferred animation speed and multiply the timers here based on it
  const { gameState } = useGameState();

  const [banHistory, setBanHistoryState] = useState(matchHistory?.banHistory || []);
  const banHistoryIndex = useRef(0);
  const [draftHistory, setDraftHistoryState] = useState(matchHistory?.pokemonAssignments || []);
  const draftHistoryIndex = useRef(0);
  const [chessMoveHistory, setChessMoveHistory] = useState(matchHistory?.chessMoveHistory || []);
  const chessMoveHistoryIndex = useRef(0);
  const [pokemonBattleHistoryState, setPokemonBattleHistoryState] = useState(matchHistory?.pokemonBattleHistory || []);
  const pokemonBattleHistoryIndex = useRef(0);
  const [catchingUp, setCatchingUp] = useState(false);

  useEffect(() => {
    setBanHistoryState(matchHistory?.banHistory || []);
    setDraftHistoryState(matchHistory?.pokemonAssignments || []);
    setChessMoveHistory(matchHistory?.chessMoveHistory || []);
    setPokemonBattleHistoryState(matchHistory?.pokemonBattleHistory || []);
  }, [matchHistory]);

  useEffect(() => {
    socket.on('startPokemonDraft', ({ square, draftPokemonIndex, socketColor, isBan }) => {
      if (isBan) {
        setBanHistoryState((curr) => [...curr, draftPokemonIndex]);
      } else {
        setDraftHistoryState((curr) => [...curr, `${socketColor} ${draftPokemonIndex} ${square}`]);
      }
    });

    socket.on('startPokemonMove', ({ move }) => {
      setPokemonBattleHistoryState((curr) => {
        return [...curr.slice(0, -1), [...curr[curr.length - 1], move]];
      });
    });

    socket.on('startChessMove', ({ sanMove }) => {
      setChessMoveHistory((curr) => [...curr, sanMove])
      if (sanMove.includes('x')) {
        setPokemonBattleHistoryState((curr) => [...curr, []]);
      }
    });

    return () => {
      socket.off('startChessMove');
      socket.off('startPokemonDraft');
      socket.off('startPokemonMove');
    };
  }, []);

  useEffect(() => {
    let catchUpTimer: { start: () => Promise<void>, stop: () => void } | undefined;
    const timeBetweenSteps = 1000 * (skipToEndOfSync ? 0 : 1);
    // On mount, start attempting to sync to the current match
    const catchUpToCurrentState = async () => {
      // Ban phase catchup
      while (banHistoryIndex.current < banHistory.length) {
        if (banHistoryIndex.current < banHistory.length - 3 && !catchingUp) {
          setCatchingUp(true);
        }
        const banPiece = banHistory[banHistoryIndex.current]!;
        banHistoryIndex.current++
        onBan(banPiece);
        catchUpTimer = timer(timeBetweenSteps);
        await catchUpTimer.start();
      }
      // Draft phase catchup
      while(draftHistoryIndex.current < draftHistory.length) {
        if (draftHistoryIndex.current < draftHistory.length - 3 && !catchingUp) {
          setCatchingUp(true);
        }
        // Instant draft on random
        const isRandomDraft = gameState.gameSettings.options.format === 'random' ? 0 : 1;
        const draft = draftHistory[draftHistoryIndex.current]!;
        draftHistoryIndex.current++
        const draftArgs = draft.split(' ');
        const color = draftArgs[0] as Color;
        const index = parseInt(draftArgs[1]);
        const square = draftArgs[2] as Square;
        onDraft(square, index, color);
        catchUpTimer = timer(timeBetweenSteps * isRandomDraft);
        await catchUpTimer.start();
      }

      while(chessMoveHistoryIndex.current < chessMoveHistory.length) {
        if (chessMoveHistoryIndex.current < chessMoveHistory.length - 3 && !catchingUp) {
          setCatchingUp(true);
        }
        const sanMove = chessMoveHistory[chessMoveHistoryIndex.current]!;
        chessMoveHistoryIndex.current++
        if (onMove(sanMove)) {
          // If handle attempt move detects a pokemon battle, wait until the battle is resolved
          pokemonBattleHistoryIndex.current++;
          if (pokemonBattleHistoryIndex.current === pokemonBattleHistoryState.length && chessMoveHistoryIndex.current === chessMoveHistory.length) {
            setCatchingUp(false);
          }
          return;
        }
        catchUpTimer = timer(timeBetweenSteps);
        await catchUpTimer.start();
      }

      setCatchingUp(false);
    }
  
    if (!currentBattle) {
      catchUpToCurrentState();
    }
    

    return () => {
      catchUpTimer?.stop();
    }
  }, [currentBattle, banHistory, draftHistory, chessMoveHistory, skipToEndOfSync]);

  return { currentPokemonMoveHistory: pokemonBattleHistoryState[pokemonBattleHistoryIndex.current - 1], catchingUp };
};

export default useBattleHistory;