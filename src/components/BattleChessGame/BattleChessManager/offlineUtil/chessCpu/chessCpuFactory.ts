import { Dex, PokemonSet } from "@pkmn/dex";
import { Chess, Move, Square } from "chess.js";
import { PokemonBattleChessManager } from "../../../../../../shared/models/PokemonBattleChessManager";
import { getCaptureSquare } from "../../../../../../shared/util/chessSquareIndex";
import {
  doesMoveDoDamage,
  getTypeEffectivenessFromSet,
} from "../../../../../util/pokemonUtil";
import { getVerboseChessMove } from "../../../ChessManager/util";
import { ChessCpu } from "../cpuFactory";
import {
  getChessMoveIfCpuInCheckmate,
  getChessMoveIfCpuInDraw,
  getChessMoveIfCpuInStalemate,
  getChessMoveIfOpponentInCheckOrCheckmate,
  getRandomChessMove,
} from "./chessCpuHelper";

type ChessCpuFactory = ({
  file,
  skillLevel,
  depth,
  multiPVLevel,
}: {
  file: string;
  skillLevel: number;
  depth: number;
  multiPVLevel: number;
}) => () => ChessCpu;

interface PossibleMove {
  move: Move;
  score: number;
  isBestMove?: boolean;
}

/**
 * Returns a new centipawn score for a chess move based on the type effectiveness
 * of both pokemon involved in the attempted capture.
 */
const modifyChessMoveScoreBasedOnTypeEffectiveness = (
  currScore: number,
  cpuPokemon: PokemonSet<string>,
  opponentPokemon: PokemonSet<string>,
): number => {
  const cpuMoves = cpuPokemon.moves;
  const opponentPokemonMoves = opponentPokemon.moves;

  /**
   * We iterate through each pokemon move for the current pokemon and opposing pokemon
   * to get the average type effectiveness.
   * Effectively, we create average out the type matchup and create a multiplier from 0.5 to 1.5
   * to modify the score by.
   */
  let averageEffectiveness = 0;
  cpuMoves.forEach((move) => {
    const dexMove = Dex.moves.get(move);
    const { effectiveness, notImmune } = getTypeEffectivenessFromSet(
      dexMove,
      cpuPokemon,
      opponentPokemon,
    );
    if (notImmune && averageEffectiveness >= 0 && doesMoveDoDamage(dexMove)) {
      // Really just need to see if we have super effective moves
      averageEffectiveness += (effectiveness + 2) / 2;
    }
  });
  opponentPokemonMoves.forEach((move) => {
    const dexMove = Dex.moves.get(move);
    const { effectiveness, notImmune } = getTypeEffectivenessFromSet(
      dexMove,
      opponentPokemon,
      cpuPokemon,
    );
    if (notImmune && effectiveness >= 0 && doesMoveDoDamage(dexMove)) {
      averageEffectiveness += (-effectiveness + 2) / 2;
    }
  });

  averageEffectiveness /= 8;
  averageEffectiveness += 0.5;

  if (currScore < 0) {
    // If the score is negative, flip the multiplier range
    averageEffectiveness = 2 - averageEffectiveness;
  }

  const newScore = currScore * averageEffectiveness;
  return newScore;
};

const modifyPossibleCaptureMoves = (
  possibleMoves: PossibleMove[],
  pokemonManager: PokemonBattleChessManager,
) => {
  for (let i = 0; i < possibleMoves.length; i++) {
    if (
      possibleMoves[i].move.isCapture() ||
      possibleMoves[i].move.isEnPassant()
    ) {
      const cpuPokemon = pokemonManager.getPokemonFromSquare(
        possibleMoves[i].move.from,
      );

      const capturedPieceSquare = getCaptureSquare(possibleMoves[i].move);
      const opponentPokemon =
        pokemonManager.getPokemonFromSquare(capturedPieceSquare);

      if (cpuPokemon && opponentPokemon) {
        const newScore = modifyChessMoveScoreBasedOnTypeEffectiveness(
          possibleMoves[i].score,
          cpuPokemon.pkmn,
          opponentPokemon.pkmn,
        );
        possibleMoves[i].score = newScore;
      }
    }
  }
};

const parseStockfishOutput = (
  output: string,
  chessManager: Chess,
): { move: Move; score: number; isBestMove?: boolean } | undefined => {
  if (output.includes("info")) {
    const pv = output.match(/pv\s+([a-h][1-8])([a-h][1-8])/);
    const score = output.match(/score\s+cp\s+(-?\d+)/);

    if (pv && score) {
      const verboseChessMove = getVerboseChessMove(
        pv[1] as Square,
        pv[2] as Square,
        chessManager,
      );
      if (verboseChessMove) {
        return { move: verboseChessMove, score: parseInt(score[1]) };
      }
    }
  } else {
    const bestMove = output.match(/^bestmove\s([a-h][1-8])([a-h][1-8])/);
    if (bestMove) {
      const verboseChessMove = getVerboseChessMove(
        bestMove[1] as Square,
        bestMove[2] as Square,
        chessManager,
      );
      if (verboseChessMove) {
        return { move: verboseChessMove, score: 0, isBestMove: true };
      }
    }
  }
  return;
};

export const chessCpuFactory: ChessCpuFactory =
  ({ file, skillLevel, depth, multiPVLevel }) =>
  () => {
    // Storing the worker globally to save memory if we create a new one. Terminating the process does not seem to restore memory used
    const worker =
      window.chessWorker || new Worker(new URL(file, import.meta.url));
    window.chessWorker = worker;

    return {
      /**
       * Runs stockfish to find the best move based on the settings.
       * Due to our chess variant, however, there are a number of invalid chess board FENs
       * that stockfish will simply not respond to. This includes:
       * - the opponent being in Check while it is stockfish's turn
       * - the opponent being in Checkmate while it is stockfish's turn
       * - Stockfish being in checkmate
       * - Stalemate
       * - Draw
       */
      move: (chessManager, pokemonManager) =>
        new Promise((resolve) => {
          const moveWhenOppInCheckOrCheckmate =
            getChessMoveIfOpponentInCheckOrCheckmate(chessManager);
          if (moveWhenOppInCheckOrCheckmate) {
            console.log(
              "Opponent in check/checkmate. Resolving move via opponent checkmate logic",
            );
            return resolve(moveWhenOppInCheckOrCheckmate);
          }

          const moveInCheckmate = getChessMoveIfCpuInCheckmate(chessManager);
          if (moveInCheckmate) {
            console.log("In checkmate. Resolving move via checkmate logic");
            return resolve(moveInCheckmate);
          }

          const moveInStalemate = getChessMoveIfCpuInStalemate(chessManager);
          if (moveInStalemate) {
            console.log("In stalemate. Resolving move via stalemate logic");
            return resolve(moveInStalemate);
          }

          const moveInDraw = getChessMoveIfCpuInDraw(chessManager);
          if (moveInDraw) {
            console.log("In draw. Resolving move via draw logic");
            return resolve(moveInDraw);
          }

          const eventListenerResolver = (verboseMove: Move) => {
            worker.removeEventListener("message", handleStockfishEvent);
            return resolve(verboseMove);
          };

          const possibleMoves: PossibleMove[] = [];

          const handleStockfishEvent = (e: MessageEvent) => {
            const parsedOutput = parseStockfishOutput(e.data, chessManager);

            if (parsedOutput?.score) {
              const existingMove = possibleMoves.find(
                (previousOutputs) =>
                  previousOutputs.move.san === parsedOutput.move.san,
              );

              if (existingMove) {
                existingMove.score = parsedOutput.score;
              } else if (parsedOutput?.score) {
                possibleMoves.push({
                  move: parsedOutput.move,
                  score: parsedOutput.score,
                });
              }
            } else if (parsedOutput?.isBestMove) {
              modifyPossibleCaptureMoves(possibleMoves, pokemonManager);
              possibleMoves.sort((moveA, moveB) => moveB.score - moveA.score);
              possibleMoves.forEach((posMove) => {
                console.log(`${posMove.move.san} - ${posMove.score}`);
              });

              if (possibleMoves.length === 0) {
                console.log(
                  "Stockfish has no recommendations. Choosing random move",
                );
                console.log(chessManager.fen());
                const randomChessMove = getRandomChessMove(chessManager);
                if (randomChessMove) {
                  return eventListenerResolver(randomChessMove);
                }
              }

              const bestMove = possibleMoves[0].move;
              if (!bestMove) {
                console.error(
                  "Something went wrong. Defaulting to random move",
                );
                const randomChessMove = getRandomChessMove(chessManager);
                if (randomChessMove) {
                  return eventListenerResolver(randomChessMove);
                } else {
                  return;
                }
              }
              console.log("Stockfish resolved");
              return eventListenerResolver(bestMove);
            } else if (e.data.includes("bestmove (none)") && chessManager) {
              /**
               * Fallback, choose a random move
               */
              console.log(
                "Stockfish has no recommendations. Choosing random move",
              );
              console.log(chessManager.fen());
              const randomChessMove = getRandomChessMove(chessManager);
              if (randomChessMove) {
                return eventListenerResolver(randomChessMove);
              }
            }
          };

          worker.addEventListener("message", handleStockfishEvent);

          worker.postMessage(`position fen ${chessManager.fen()}`);
          worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
          worker.postMessage(`setoption name multipv value ${multiPVLevel}`);
          worker.postMessage(`go depth ${depth}`);
        }),
    };
  };
