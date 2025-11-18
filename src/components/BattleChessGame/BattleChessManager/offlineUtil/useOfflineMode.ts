import { Battle } from "@pkmn/client";
import { Generations, PokemonSet } from "@pkmn/data";
import { Dex } from "@pkmn/dex";
import { Protocol } from "@pkmn/protocol";
import { PRNG, PRNGSeed } from "@pkmn/sim";
import { Chess, Color, Square } from "chess.js";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { PokemonBattleChessManager } from "../../../../../shared/models/PokemonBattleChessManager";
import {
  getChessMatchOutput,
  getNewSquareModTargetNumber,
  getPokemonBattleOutput,
  getWeatherChangeOutput,
} from "../../../../../shared/src/gameLogic";
import { MatchHistory, MatchLog } from "../../../../../shared/types/Game";
import { useGameState } from "../../../../context/GameState/GameStateContext";
import {
  CHESS_MOVE_ERROR,
  POKEMON_ENGINE_ERROR,
} from "../../../../util/errorMessages";
import { getCpuPlayerId } from "../../../../util/offlineUtil";
import { usePlayAgainstComputerUtil } from "../../../RoomManager/usePlayAgainstComputerUtil";
import { availableBotLevels } from "./cpuFactory";

const createPokemonBattle = (
  p1PokemonSet: PokemonSet<string>,
  p2PokemonSet: PokemonSet<string>,
  perspective: "p1" | "p2",
) => {
  const newGeneration = new Generations(Dex);
  const newBattle = new Battle(
    newGeneration,
    null,
    [
      [perspective === "p1" ? p1PokemonSet : p2PokemonSet],
      [perspective === "p1" ? p2PokemonSet : p1PokemonSet],
    ],
    undefined,
  );
  return newBattle;
};

const handlePokemonOutput = (
  battleRef: RefObject<Battle | null>,
  log: MatchLog,
) => {
  if (log.type === "pokemon" && log.data.event === "battleStart") {
    battleRef.current = createPokemonBattle(
      log.data.p1Pokemon,
      log.data.p2Pokemon,
      "p1",
    );
  } else if (
    log.type === "pokemon" &&
    log.data.event === "streamOutput" &&
    battleRef.current
  ) {
    const parsedChunk = Protocol.parse(log.data.chunk);
    for (const { args, kwArgs } of parsedChunk) {
      battleRef.current.add(args, kwArgs);
    }
  } else if (log.type === "pokemon" && log.data.event === "victory") {
    battleRef.current = null;
  }
};

export const useOfflineMode = ({
  chessManager,
  pokemonManager,
  playerColor,
  setCurrentMatchLog,
}: {
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  playerColor: Color;
  setCurrentMatchLog: (
    cb: (currentMatchHistory: MatchHistory) => MatchHistory,
  ) => void;
}) => {
  const { gameState } = useGameState();

  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [battleSeed, setBattleSeed] = useState<PRNGSeed>();
  const [currentPokemonBattleStakes, setCurrentPokemonBattleStakes] = useState<{
    san: string;
    color: Color;
  }>();
  const [squareModTarget, setSquareModTarget] = useState(
    getNewSquareModTargetNumber(),
  );

  const whitePlayerId = useMemo(
    () => gameState.gameSettings.whitePlayer?.playerId || "",
    [gameState.gameSettings.whitePlayer],
  );
  const blackPlayerId = useMemo(
    () => gameState.gameSettings.blackPlayer?.playerId || "",
    [gameState.gameSettings.blackPlayer],
  );

  const whitePokemonBattle = useRef<Battle | null>(null);
  const blackPokemonBattle = useRef<Battle | null>(null);

  const { isUserInOfflineMode } = usePlayAgainstComputerUtil();

  const chessCpu = useMemo(() => {
    if (isUserInOfflineMode()) {
      return availableBotLevels[gameState.cpuDifficulty]["chessCpu"]();
    }
  }, [isUserInOfflineMode, gameState.cpuDifficulty]);

  const pokemonCpu = useMemo(() => {
    if (isUserInOfflineMode()) {
      return availableBotLevels[gameState.cpuDifficulty]["pokemonCpu"]();
    }
  }, [isUserInOfflineMode, gameState.cpuDifficulty]);

  const updateMatchLogFromChessMove = useCallback(
    async (san: string) => {
      const chessOutput = await getChessMatchOutput({
        sanMove: san,
        currentTurn: chessManager.turn(),
        gameOptions: gameState.gameSettings.options,
        chessManager,
        pokemonManager,
        whitePlayerId,
        blackPlayerId,
        onPokemonBattleCreated: async ({ attemptedMove, battleSeed }) => {
          return new Promise((resolve) => {
            setMoveHistory([]);
            setCurrentPokemonBattleStakes(attemptedMove);
            setBattleSeed(battleSeed);
            resolve();
          });
        },
      });
      const whiteStreamOutput = chessOutput?.whiteStreamOutput || [];
      const blackStreamOutput = chessOutput?.blackStreamOutput || [];

      const weatherChangeOutput = getWeatherChangeOutput({
        gameOptions: gameState.gameSettings.options,
        currentTurn: chessManager.turn(),
        chessManager,
        pokemonManager,
        squareModifierTarget: squareModTarget,
      });

      if (weatherChangeOutput?.newModifierTarget) {
        setSquareModTarget(weatherChangeOutput.newModifierTarget);
      }

      if (weatherChangeOutput?.squareModifierLog) {
        whiteStreamOutput.push(weatherChangeOutput.squareModifierLog);
        blackStreamOutput.push(weatherChangeOutput.squareModifierLog);
      }

      const output =
        playerColor === "w" ? whiteStreamOutput : blackStreamOutput;
      if (output) {
        setCurrentMatchLog((curr) => [...curr, ...output]);
        whiteStreamOutput.forEach((log) =>
          handlePokemonOutput(whitePokemonBattle, log),
        );
        blackStreamOutput.forEach((log) =>
          handlePokemonOutput(blackPokemonBattle, log),
        );
      } else {
        toast(CHESS_MOVE_ERROR, { type: "error" });
        console.error(san);
        console.error(output);
      }
    },
    [
      chessManager,
      pokemonManager,
      whitePlayerId,
      blackPlayerId,
      playerColor,
      setCurrentMatchLog,
      gameState.gameSettings.options,
      squareModTarget,
    ],
  );

  const requestComputerMove = useCallback(async () => {
    const verboseChessMove = await chessCpu?.move(chessManager, pokemonManager);

    if (verboseChessMove) {
      updateMatchLogFromChessMove(verboseChessMove.san);
    }
  }, [chessManager, pokemonManager, updateMatchLogFromChessMove, chessCpu]);

  const requestComputerPokemonMove = useCallback(
    async (playerSide: "p1" | "p2") => {
      if (!whitePokemonBattle.current || !blackPokemonBattle.current) {
        console.error(
          "Unable to initialize battle for CPU. Choosing to forfeit.",
        );
        return "forfeit";
      }
      try {
        const pokemonMove = await pokemonCpu?.move(
          playerSide,
          playerSide === "p1"
            ? whitePokemonBattle.current
            : blackPokemonBattle.current,
        );
        return pokemonMove || "default";
      } catch (err) {
        console.error(err);
        return "default";
      }
    },
    [pokemonCpu],
  );

  const requestComputerPokemonBanOrDraft = useCallback(
    (
      onBan: (index: number) => void,
      onDraft: (square: Square, index: number, color: Color) => void,
      turn: Color,
    ) => {
      const isBan = pokemonManager.draftPieces.length > 32;

      if (isBan && pokemonCpu) {
        onBan(pokemonCpu.banPokemon(pokemonManager));
      } else if (pokemonCpu) {
        const draftPick = pokemonCpu.draftPokemon(turn, pokemonManager);
        onDraft(draftPick.square, draftPick.index, draftPick.color);
      }
    },
    [pokemonManager, pokemonCpu],
  );

  const updateMatchLogFromPokemonMove = useCallback(
    async (move: string) => {
      if (!currentPokemonBattleStakes) {
        toast(POKEMON_ENGINE_ERROR, { type: "error" });
        console.error(currentPokemonBattleStakes);
        return;
      }

      let opposingPlayerPokemonMove = move;
      if (gameState.isSpectator) {
        opposingPlayerPokemonMove = await requestComputerPokemonMove(
          gameState.gameSettings.whitePlayer?.playerId ===
            getCpuPlayerId({ playerSide: "p1" })
            ? "p1"
            : "p2",
        );
      }
      const cpuMove = await requestComputerPokemonMove(
        gameState.gameSettings.whitePlayer?.playerId ===
          getCpuPlayerId({ playerSide: "p2" })
          ? "p1"
          : "p2",
      );

      const pokemonOutput = await getPokemonBattleOutput({
        p1PokemonMove:
          playerColor === "w" ? opposingPlayerPokemonMove : cpuMove,
        p2PokemonMove:
          playerColor === "b" ? opposingPlayerPokemonMove : cpuMove,
        moveHistory,
        currentPokemonBattleStakes: currentPokemonBattleStakes || null,
        seed: battleSeed || new PRNG().getSeed(),
        advantageSide: chessManager.turn() === "w" ? "p1" : "p2",
        whitePlayerId,
        blackPlayerId,
        gameOptions: gameState.gameSettings.options,
        pokemonManager,
        chessManager,
      });

      if (!pokemonOutput?.whiteStream || !pokemonOutput.blackStream) {
        toast(POKEMON_ENGINE_ERROR, {
          type: "error",
        });
        return;
      }
      pokemonOutput.whiteStream.forEach((log) =>
        handlePokemonOutput(whitePokemonBattle, log),
      );
      pokemonOutput.blackStream.forEach((log) =>
        handlePokemonOutput(blackPokemonBattle, log),
      );

      const output =
        playerColor === "w"
          ? [...pokemonOutput.whiteStream, ...pokemonOutput.omniscientStream]
          : [...pokemonOutput.blackStream, ...pokemonOutput.omniscientStream];
      if (output) {
        setCurrentMatchLog((curr) => [...curr, ...output]);
        setMoveHistory((curr) => [
          ...curr,
          `>${playerColor === "w" ? "p1" : "p2"} move ${opposingPlayerPokemonMove}`,
          `>${playerColor === "w" ? "p2" : "p1"} move ${cpuMove}`,
        ]);
      } else {
        toast(POKEMON_ENGINE_ERROR, { type: "error" });
        console.error(opposingPlayerPokemonMove);
        console.error(output);
      }
    },
    [
      whitePlayerId,
      blackPlayerId,
      chessManager,
      pokemonManager,
      gameState.gameSettings.options,
      playerColor,
      setCurrentMatchLog,
      battleSeed,
      currentPokemonBattleStakes,
      moveHistory,
      requestComputerPokemonMove,
      gameState.isSpectator,
      gameState.gameSettings.whitePlayer,
    ],
  );

  return {
    updateMatchLogFromChessMove,
    updateMatchLogFromPokemonMove,
    requestComputerMove,
    requestComputerPokemonBanOrDraft,
  };
};
