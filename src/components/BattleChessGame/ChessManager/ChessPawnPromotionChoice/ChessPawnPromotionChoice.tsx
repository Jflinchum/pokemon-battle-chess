import { Color, PieceSymbol, Square } from "chess.js";
import { useMemo } from "react";
import { createPortal } from "react-dom";
import ChessPieceSprite from "../ChessBoard/ChessPieceSprite/ChessPieceSprite";
import { allPieceTypes } from "../constants";
import "./ChessPawnPromotionChoice.css";

interface ChessPawnPromotionMenuProps {
  color: Color;
  onPromotionChoice: (chosenPiece: PieceSymbol) => void;
  onPromotionCancel: () => void;
}

export interface ChessPawnPromotionChoiceProps {
  toSquare: Square;
  color: Color;
  onPromotionChoice: (chosenPiece: PieceSymbol) => void;
  onPromotionCancel: () => void;
}

const ChessPawnPromotionMenu = ({
  color,
  onPromotionChoice,
  onPromotionCancel,
}: ChessPawnPromotionMenuProps) => {
  return (
    <div
      className="chessPiecePromotionMenu"
      data-testid="chess-piece-promotion-menu"
    >
      {allPieceTypes
        .filter((p) => p !== "p" && p !== "k")
        .map((piece) => (
          <button
            key={piece}
            className="chessPiecePromotionButton"
            data-testid={`chess-piece-promotion-choice-${piece}`}
            onClick={() => onPromotionChoice(piece)}
          >
            <ChessPieceSprite type={piece} color={color} />
          </button>
        ))}
      <button
        data-testid="chess-piece-promotion-cancel"
        onClick={onPromotionCancel}
      >
        Cancel
      </button>
    </div>
  );
};

const ChessPawnPromotionChoice = ({
  toSquare,
  color,
  onPromotionChoice,
  onPromotionCancel,
}: ChessPawnPromotionChoiceProps) => {
  const squareElement = useMemo(
    () => document.body.querySelectorAll(`#chessSquare-${toSquare}`)[0],
    [toSquare],
  );
  if (squareElement) {
    return (
      <>
        {createPortal(
          <div
            className="chessPiecePromotionPortal"
            data-testid="chess-piece-promotion-portal"
          >
            <ChessPawnPromotionMenu
              color={color}
              onPromotionChoice={onPromotionChoice}
              onPromotionCancel={onPromotionCancel}
            />
          </div>,
          squareElement,
        )}
      </>
    );
  }
  return (
    <ChessPawnPromotionMenu
      color={color}
      onPromotionChoice={onPromotionChoice}
      onPromotionCancel={onPromotionCancel}
    />
  );
};

export default ChessPawnPromotionChoice;
