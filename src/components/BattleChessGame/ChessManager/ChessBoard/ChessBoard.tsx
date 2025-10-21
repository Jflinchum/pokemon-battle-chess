import { Color, PieceSymbol, Square } from "chess.js";
import { SquareModifier } from "../../../../../shared/models/PokemonBattleChessManager";
import { PokemonChessBoardSquare } from "../../../../types/chess/PokemonChessBoardSquare";
import { getSquareColor } from "../util";
import "./ChessBoard.css";
import ChessSquare from "./ChessSquare/ChessSquare";

export interface ChessBoardProps {
  color: Color;
  boardState: PokemonChessBoardSquare[][];
  squareModifiers?: SquareModifier[];
  onSquareClick: (arg0: PokemonChessBoardSquare) => void;
  onSquareHover?: (arg0?: PokemonChessBoardSquare | null) => void;
  onPieceDrag: (arg0: PokemonChessBoardSquare) => void;
  onPieceDrop: (arg0: PokemonChessBoardSquare) => void;
  highlightedSquares: Square[];
  selectedSquare: Square | null;
  mostRecentMove?: { from: Square; to: Square } | null;
  preMoveQueue?: { from: Square; to: Square; promotion?: PieceSymbol }[];
  battleSquare?: Square;
  minimizeOnColumnLayout?: boolean;
}

const boardColumnPerspective = (
  squares: PokemonChessBoardSquare[][],
  color: Color,
) => {
  if (color === "w") {
    return squares;
  } else {
    return [...squares].reverse();
  }
};

const boardRowPersepective = (
  squares: PokemonChessBoardSquare[],
  color: Color,
) => {
  if (color === "w") {
    return squares;
  } else {
    return [...squares].reverse();
  }
};

const shouldMinimizeChessRow = (rowIndex: number) => {
  return rowIndex >= 2 && rowIndex <= 5;
};

const ChessBoard = ({
  color,
  boardState,
  squareModifiers = [],
  onSquareClick,
  onSquareHover,
  onPieceDrag,
  onPieceDrop,
  highlightedSquares,
  selectedSquare,
  mostRecentMove,
  preMoveQueue = [],
  battleSquare,
  minimizeOnColumnLayout,
}: ChessBoardProps) => {
  return (
    <div className={`chessBoard ${minimizeOnColumnLayout ? "minimize" : ""}`}>
      {boardColumnPerspective(boardState, color).map((boardRow, rowIndex) => (
        <div
          className={`chessRow ${minimizeOnColumnLayout && shouldMinimizeChessRow(rowIndex) ? "minimizeRow" : ""}`}
          key={rowIndex}
        >
          {boardRowPersepective(boardRow, color).map(
            (boardSquare, columnIndex) => {
              return (
                <ChessSquare
                  perspective={color}
                  key={columnIndex}
                  square={boardSquare}
                  squareModifier={squareModifiers.find(
                    (sqMod) => sqMod.square === boardSquare.square,
                  )}
                  backgroundColor={getSquareColor(rowIndex, columnIndex)}
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
            },
          )}
        </div>
      ))}
    </div>
  );
};

export default ChessBoard;
