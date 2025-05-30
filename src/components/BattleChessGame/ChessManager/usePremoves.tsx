import { Chess, Square, PieceSymbol, Move, Color } from "chess.js";
import { PokemonBattleChessManager } from "../../../../shared/models/PokemonBattleChessManager";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getVerboseChessMove } from "./util";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { PokemonChessBoardSquare } from "./types";

const createChessManagerCopy = (chessManager: Chess, color: Color) => {
  const chessManagerCopy = new Chess(chessManager.fen(), {
    skipValidation: true,
  });
  if (chessManagerCopy.turn() !== color) {
    chessManagerCopy.forceAdvanceTurn();
  }
  return chessManagerCopy;
};

const createPokemonManagerCopy = (
  pokemonManager: PokemonBattleChessManager,
) => {
  return new PokemonBattleChessManager({
    squareModifiers: pokemonManager.squareModifiers,
    chessPieces: JSON.parse(JSON.stringify(pokemonManager.getChessPieces())),
  });
};

export const usePremoves = (
  board: PokemonChessBoardSquare[][],
  chessManager: Chess,
  pokemonManager: PokemonBattleChessManager,
) => {
  const { gameState } = useGameState();
  const color = useMemo(() => gameState.gameSettings!.color!, [gameState]);
  const [preMoveQueue, setPreMoveQueue] = useState<
    { from: Square; to: Square; promotion?: PieceSymbol; san: string }[]
  >([]);
  const [simulatedChessManager, setSimulatedChessManager] = useState(() =>
    createChessManagerCopy(chessManager, color),
  );
  const [simulatedPokemonManager, setSimulatedPokemonManager] = useState(() =>
    createPokemonManagerCopy(pokemonManager),
  );
  const [simulatedBoard, setSimulatedBoard] = useState(
    simulatedChessManager.board(),
  );

  const resetSimulators = useCallback(() => {
    const chessCopy = createChessManagerCopy(chessManager, color);
    setSimulatedChessManager(chessCopy);
    setSimulatedPokemonManager(createPokemonManagerCopy(pokemonManager));
    setSimulatedBoard(chessCopy.board());
  }, [chessManager, color, pokemonManager]);

  const simulateMove = useCallback(
    (move: Move) => {
      simulatedChessManager.move(move, { continueOnCheck: true });
      simulatedPokemonManager.movePokemonToSquare(
        move.from,
        move.to,
        move.promotion,
      );
      simulatedChessManager.forceAdvanceTurn();
      setSimulatedBoard(simulatedChessManager.board());
    },
    [simulatedChessManager, simulatedPokemonManager],
  );

  useEffect(() => {
    const chessManagerCopy = createChessManagerCopy(chessManager, color);
    const pokemonManagerCopy = createPokemonManagerCopy(pokemonManager);

    if (chessManagerCopy.turn() !== color) {
      chessManagerCopy.forceAdvanceTurn();
    }

    let i = 0;
    for (; i < preMoveQueue.length; i++) {
      const preMove = preMoveQueue[i];
      const verboseMove = getVerboseChessMove(
        preMove.from,
        preMove.to,
        chessManagerCopy,
        preMove.promotion,
      );
      if (verboseMove && preMove.san === verboseMove?.san) {
        chessManagerCopy.move(preMove, { continueOnCheck: true });
        pokemonManagerCopy.movePokemonToSquare(
          verboseMove.from,
          verboseMove.to,
          verboseMove.promotion,
        );
        chessManagerCopy.forceAdvanceTurn();
      } else {
        break;
      }
    }
    // If we had to break early due to a move being invalid
    if (i !== preMoveQueue.length) {
      setPreMoveQueue((curr) => curr.slice(0, i));
    }

    setSimulatedChessManager(chessManagerCopy);
    setSimulatedPokemonManager(pokemonManagerCopy);
    setSimulatedBoard(chessManagerCopy.board());
  }, [board, pokemonManager, chessManager, color, preMoveQueue]);

  return {
    simulatedChessManager,
    simulatedPokemonManager,
    preMoveQueue,
    setPreMoveQueue,
    resetSimulators,
    simulateMove,
    simulatedBoard,
  };
};
