import { Chess, Color, Move, PieceSymbol, Square } from "chess.js";
import { useCallback, useMemo, useState } from "react";
import { PokemonBattleChessManager } from "../../../../shared/models/PokemonBattleChessManager";
import { useGameState } from "../../../context/GameState/GameStateContext";
import {
  getVerboseChessMove,
  mergeBoardAndPokemonState,
} from "../ChessManager/util";

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
    mergeBoardAndPokemonState(
      simulatedChessManager.board(),
      simulatedPokemonManager,
    ),
  );

  const resetSimulators = useCallback(() => {
    const chessCopy = createChessManagerCopy(chessManager, color);
    setSimulatedChessManager(chessCopy);
    setSimulatedPokemonManager(createPokemonManagerCopy(pokemonManager));
    setSimulatedBoard(
      mergeBoardAndPokemonState(chessCopy.board(), pokemonManager),
    );
  }, [chessManager, color, pokemonManager]);

  const simulateMove = useCallback(
    (move: Move) => {
      setPreMoveQueue((curr) => [
        ...curr,
        {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: move.san,
        },
      ]);
      simulatedChessManager.move(move, { continueOnCheck: true });
      simulatedPokemonManager.movePokemonToSquare(
        move.from,
        move.to,
        move.promotion,
      );
      simulatedChessManager.forceAdvanceTurn();
      setSimulatedBoard(
        mergeBoardAndPokemonState(
          simulatedChessManager.board(),
          simulatedPokemonManager,
        ),
      );
    },
    [simulatedChessManager, simulatedPokemonManager],
  );

  const validatePremoveQueue = useCallback(() => {
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
      setSimulatedChessManager(chessManagerCopy);
      setSimulatedPokemonManager(pokemonManagerCopy);
      setSimulatedBoard(
        mergeBoardAndPokemonState(chessManagerCopy.board(), pokemonManagerCopy),
      );
      return false;
    }

    setSimulatedChessManager(chessManagerCopy);
    setSimulatedPokemonManager(pokemonManagerCopy);
    setSimulatedBoard(
      mergeBoardAndPokemonState(chessManagerCopy.board(), pokemonManagerCopy),
    );
    return true;
  }, [pokemonManager, chessManager, color, preMoveQueue]);

  return {
    simulatedChessManager,
    simulatedPokemonManager,
    resetSimulators,
    simulateMove,
    simulatedBoard,
    validatePremoveQueue,
    preMoveQueue,
    setPreMoveQueue,
  };
};
