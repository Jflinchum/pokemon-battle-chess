import { useState } from "react";
import { Chess, Square, Move, Color, PieceSymbol } from "chess.js";
import ChessBoard from "./ChessBoard/ChessBoard";
import { PokemonBattleChessManager } from "../../../../shared/models/PokemonBattleChessManager";
import PokemonChessDetailsCard from "../PokemonManager/PokemonChessDetailsCard/PokemonChessDetailsCard";
import { PokemonChessBoardSquare } from "../../../types/chess/PokemonChessBoardSquare";
import ChessPawnPromotionChoice from "./ChessPawnPromotionChoice/ChessPawnPromotionChoice";
import {
  getCastleSquare,
  getVerboseChessMove,
  userAttemptingCastle,
} from "./util";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { useDebounce } from "../../../utils";
import { ChessData } from "../../../../shared/types/Game";
import { Arrow, ArrowController } from "./ArrowController/ArrowController";
import "./ChessManager.css";
import { MoveAttempt } from "../../../types/chess/MoveAttempt";

interface ChessManagerProps {
  hide?: boolean;
  color: Color;
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  mostRecentMove: { from: Square; to: Square } | null;
  arrows: Arrow[];
  board: PokemonChessBoardSquare[][];
  onMove: (san: string) => void;
  chessMoveHistory: ChessData[];
  battleSquare?: Square;
  preMoveQueue?: { from: Square; to: Square; promotion?: PieceSymbol }[];
}

const ChessManager = ({
  hide,
  color,
  chessManager,
  pokemonManager,
  mostRecentMove,
  arrows,
  battleSquare,
  board,
  onMove,
  chessMoveHistory,
  preMoveQueue,
}: ChessManagerProps) => {
  /**
   * TODO:
   *  - Set up context providers to handle pokemon manager state
   */
  const { gameState } = useGameState();

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<Square | null | undefined>(
    null,
  );
  const [highlightedSquares, setHighlightedSquare] = useState<Square[]>([]);
  const [requestedPawnPromotion, setRequestedPawnPromotion] =
    useState<Move | null>(null);

  const cancelSelection = () => {
    setSelectedSquare(null);
    setHighlightedSquare([]);
  };

  const updateSelection = (square: Square) => {
    setSelectedSquare(square);

    const selectedSquareMoves = chessManager
      .moves({
        square,
        piece: chessManager.get(square)?.type,
        verbose: true,
        continueOnCheck: true,
      })
      .filter((move) => move.color === color);
    setHighlightedSquare(
      selectedSquareMoves.map((squareMove) => squareMove.to) as Square[],
    );
  };

  const movePiece = ({ fromSquare, toSquare, promotion }: MoveAttempt) => {
    if (
      gameState.isSpectator ||
      gameState.matchEnded ||
      gameState.isCatchingUp
    ) {
      return;
    }
    if (chessManager.turn() !== color) {
      return;
    }
    const verboseChessMove = getVerboseChessMove(
      fromSquare,
      toSquare,
      chessManager,
      promotion,
    );
    // Before attempting the move, ask the player for their pawn promotion choice
    if (verboseChessMove?.isPromotion() && !promotion) {
      setRequestedPawnPromotion(verboseChessMove);
      return;
    }

    if (!verboseChessMove) {
      return;
    }

    onMove(verboseChessMove.san);
    setSelectedSquare(null);
    setHighlightedSquare([]);
  };

  const handleSquareClick = ({ square }: PokemonChessBoardSquare) => {
    setRequestedPawnPromotion(null);
    // If there's no current selected square, or the clicked square isn't a valid move, then set the clicked square to the current selected square
    if (selectedSquare === square) {
      // Cancel the selection if it's the same as the already selected square
      cancelSelection();
    } else {
      // Set the current square in state and highlight any potential moves for that square
      updateSelection(square);
    }
    handleMovePiece({ square });
  };

  const handleSquareHover = useDebounce(
    (pkmnChessSquare?: PokemonChessBoardSquare | null) => {
      setHoveredSquare(pkmnChessSquare?.square);
    },
    100,
  );

  const handlePieceDrop = ({ square }: PokemonChessBoardSquare) => {
    return handleMovePiece({ square });
  };

  const handleMovePiece = ({ square }: PokemonChessBoardSquare) => {
    if (selectedSquare) {
      const verboseChessMove = getVerboseChessMove(
        selectedSquare,
        square,
        chessManager,
      );
      if (verboseChessMove) {
        if (verboseChessMove.color === color) {
          movePiece({ fromSquare: selectedSquare, toSquare: square });
        }
      } else if (userAttemptingCastle(selectedSquare, square, chessManager)) {
        const castleSquare = getCastleSquare(square);
        if (castleSquare) {
          movePiece({ fromSquare: selectedSquare, toSquare: castleSquare });
        }
      }
    }
  };

  const handlePieceDrag = ({ square }: PokemonChessBoardSquare) => {
    setRequestedPawnPromotion(null);
    updateSelection(square);
  };

  return (
    <div
      style={{
        display: hide ? "none" : "block",
      }}
      className="gameContainer"
    >
      {requestedPawnPromotion && (
        <ChessPawnPromotionChoice
          pawnPromotionMove={requestedPawnPromotion}
          onPromotionCancel={() => {
            setRequestedPawnPromotion(null);
            setHighlightedSquare([]);
            setSelectedSquare(null);
          }}
          onPromotionChoice={(type) => {
            setRequestedPawnPromotion(null);
            movePiece({
              fromSquare: requestedPawnPromotion.from,
              toSquare: requestedPawnPromotion.to,
              promotion: type,
            });
          }}
        />
      )}
      <div className="chessGameContainer">
        <ArrowController
          className="chessArrowController"
          arrows={arrows}
          perspective={color || "w"}
        >
          <ChessBoard
            color={color}
            boardState={board}
            onSquareClick={handleSquareClick}
            onSquareHover={handleSquareHover}
            onPieceDrag={handlePieceDrag}
            onPieceDrop={handlePieceDrop}
            highlightedSquares={highlightedSquares}
            selectedSquare={selectedSquare}
            mostRecentMove={mostRecentMove}
            battleSquare={battleSquare}
            preMoveQueue={preMoveQueue}
          />
        </ArrowController>
        <PokemonChessDetailsCard
          chessMoveHistory={chessMoveHistory}
          squareModifier={
            pokemonManager.getModifiersFromSquare(hoveredSquare) ||
            pokemonManager.getModifiersFromSquare(selectedSquare)
          }
          pokemon={
            pokemonManager.getPokemonFromSquare(hoveredSquare)?.pkmn ||
            pokemonManager.getPokemonFromSquare(selectedSquare)?.pkmn
          }
        />
      </div>
    </div>
  );
};

export default ChessManager;
