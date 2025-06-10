import { useState, useMemo } from "react";
import { Chess, Square, Move, Color } from "chess.js";
import ChessBoard from "./ChessBoard/ChessBoard";
import { PokemonBattleChessManager } from "../../../../shared/models/PokemonBattleChessManager";
import PokemonChessDetailsCard from "../PokemonManager/PokemonChessDetailsCard/PokemonChessDetailsCard";
import { MoveAttempt, PokemonChessBoardSquare } from "./types";
import ChessPawnPromotionChoice from "./ChessPawnPromotionChoice/ChessPawnPromotionChoice";
import { getVerboseChessMove, getVerboseSanChessMove } from "./util";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { CurrentBattle } from "../BattleChessManager/BattleChessManager";
import { useDebounce } from "../../../utils";
import { ChessData } from "../../../../shared/types/game";
import { ArrowController } from "./ArrowController/ArrowController";
import "./ChessManager.css";

interface ChessManagerProps {
  demoMode?: boolean;
  hide?: boolean;
  color: Color;
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  mostRecentMove: { from: Square; to: Square } | null;
  currentBattle?: CurrentBattle | null;
  board: PokemonChessBoardSquare[][];
  onMove: (san: string) => void;
  chessMoveHistory: ChessData[];
  battleSquare?: Square;
}

const ChessManager = ({
  demoMode,
  hide,
  color,
  chessManager,
  pokemonManager,
  mostRecentMove,
  currentBattle,
  battleSquare,
  board,
  onMove,
  chessMoveHistory,
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

  const currentArrows = useMemo(() => {
    const arrows = [];

    if (mostRecentMove) {
      arrows.push({
        from: mostRecentMove.from,
        to: mostRecentMove.to,
        type: "default" as const,
      });
    }

    if (currentBattle) {
      const battleChessMove = getVerboseSanChessMove(
        currentBattle.attemptedMove.san,
        chessManager,
      );
      if (battleChessMove) {
        arrows.push({
          from: battleChessMove.from,
          to: battleChessMove.to,
          type: "battle" as const,
        });
      }
    }
    return arrows;
  }, [mostRecentMove, currentBattle, chessManager]);

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
    if (
      selectedSquare &&
      getVerboseChessMove(selectedSquare, square, chessManager)?.color === color
    ) {
      movePiece({ fromSquare: selectedSquare, toSquare: square });
    }
  };

  const handleSquareHover = useDebounce(
    (pkmnChessSquare?: PokemonChessBoardSquare | null) => {
      setHoveredSquare(pkmnChessSquare?.square);
    },
    100,
  );

  const handlePieceDrop = ({ square }: PokemonChessBoardSquare) => {
    if (
      selectedSquare &&
      getVerboseChessMove(selectedSquare, square, chessManager)?.color === color
    ) {
      movePiece({ fromSquare: selectedSquare, toSquare: square });
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
      {!demoMode && (
        <div className="turnNotification">
          {chessManager.turn() === color ? (
            <strong className="highPriorityNotification">
              Your turn to move!
            </strong>
          ) : (
            <strong>Waiting for opponent...</strong>
          )}
        </div>
      )}
      <div className="chessGameContainer">
        <ArrowController
          className="chessArrowController"
          arrows={currentArrows}
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
            preMoveQueue={[]}
          />
        </ArrowController>
        <PokemonChessDetailsCard
          chessMoveHistory={chessMoveHistory}
          squareModifier={
            pokemonManager.getWeatherFromSquare(hoveredSquare) ||
            pokemonManager.getWeatherFromSquare(selectedSquare)
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
