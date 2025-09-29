import { Color, PieceSymbol, Square } from "chess.js";
import { getSquareColor } from "../util";
import ChessSquare from "./ChessSquare/ChessSquare";
import { PokemonChessBoardSquare } from "../../../../types/chess/PokemonChessBoardSquare";
import { SquareModifier } from "../../../../../shared/models/PokemonBattleChessManager";
import "./ChessBoard.css";

interface ChessBoardProps {
  color: Color;
  boardState: PokemonChessBoardSquare[][];
  squareModifiers: SquareModifier[];
  onSquareClick: (arg0: PokemonChessBoardSquare) => void;
  onSquareHover?: (arg0?: PokemonChessBoardSquare | null) => void;
  onPieceDrag: (arg0: PokemonChessBoardSquare) => void;
  onPieceDrop: (arg0: PokemonChessBoardSquare) => void;
  highlightedSquares: Square[];
  selectedSquare: Square | null;
  mostRecentMove?: { from: Square; to: Square } | null;
  preMoveQueue?: { from: Square; to: Square; promotion?: PieceSymbol }[];
  battleSquare?: Square;
}

const ChessBoard = ({
  color,
  boardState,
  squareModifiers,
  onSquareClick,
  onSquareHover,
  onPieceDrag,
  onPieceDrop,
  highlightedSquares,
  selectedSquare,
  mostRecentMove,
  preMoveQueue = [],
  battleSquare,
}: ChessBoardProps) => {
  const boardColumnPerspective = (squares: PokemonChessBoardSquare[][]) => {
    if (color === "w") {
      return squares;
    } else {
      return [...squares].reverse();
    }
  };

  const normalizedRowIndex = (index: number) => {
    if (color === "w") {
      return index;
    } else {
      return (index - 7) * -1;
    }
  };

  return (
    <div className="chessBoard">
      {boardColumnPerspective(boardState).map((boardRow, rowIndex) => (
        <div className="chessRow" key={rowIndex}>
          {boardRow.map((boardSquare, columnIndex) => {
            return (
              <ChessSquare
                key={columnIndex}
                square={boardSquare}
                squareModifier={squareModifiers.find(
                  (sqMod) => sqMod.square === boardSquare.square,
                )}
                backgroundColor={getSquareColor(
                  normalizedRowIndex(rowIndex),
                  columnIndex,
                )}
                onClick={(square) => {
                  onSquareClick(square);
                }}
                onSquareHover={onSquareHover}
                onPieceDrag={(square) => {
                  onPieceDrag(square);
                }}
                onPieceDrop={(square) => {
                  onPieceDrop(square);
                }}
                possibleMove={highlightedSquares.includes(boardSquare.square)}
                selected={selectedSquare === boardSquare.square}
                mostRecentMove={
                  mostRecentMove?.from === boardSquare.square ||
                  mostRecentMove?.to === boardSquare.square
                }
                isPreMove={
                  !!preMoveQueue.find(
                    (premove) =>
                      boardSquare.square === premove.from ||
                      boardSquare.square === premove.to,
                  )
                }
                isBattleSquare={boardSquare.square === battleSquare || false}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ChessBoard;
