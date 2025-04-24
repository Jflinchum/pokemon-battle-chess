import { Move, PieceSymbol } from "chess.js";
import { allPieceTypes } from "../constants";
import ChessPieceSprite from "../ChessBoard/ChessPieceSprite/ChessPieceSprite";
import './ChessPawnPromotionChoice.css'
import { createPortal } from "react-dom";
import { useMemo } from "react";

interface ChessPawnPromotionChoiceProps {
  pawnPromotionMove: Move;
  onPromotionChoice: (chosenPiece: PieceSymbol) => void;
  onPromotionCancel: () => void;
}

const ChessPawnPromotionMenu = ({ pawnPromotionMove, onPromotionChoice, onPromotionCancel }: ChessPawnPromotionChoiceProps) => {
  return (
    <div className='chessPiecePromotionMenu'>
      {
        allPieceTypes.filter((p) => p !== 'p' && p !== 'k').map((piece) => (
          <button key={piece} className='chessPiecePromotionButton' onClick={() => onPromotionChoice(piece)}>
            <ChessPieceSprite type={piece} color={pawnPromotionMove.color} />
          </button>
        ))
      }
      <button onClick={onPromotionCancel}>Cancel</button>
    </div>
  );
}

const ChessPawnPromotionChoice = ({ pawnPromotionMove, onPromotionChoice, onPromotionCancel }: ChessPawnPromotionChoiceProps) => {
  const squareElement = useMemo(() => document.body.querySelectorAll(`#chessSquare-${pawnPromotionMove.to}`)[0], [pawnPromotionMove]);
  if (squareElement) {
    return (
      <>
        {
          createPortal(
            <div className='chessPiecePromotionPortal'>
              <ChessPawnPromotionMenu pawnPromotionMove={pawnPromotionMove} onPromotionChoice={onPromotionChoice} onPromotionCancel={onPromotionCancel} />
            </div>,
            squareElement
          )
        }
      </>
    );
  }
  return (
    <ChessPawnPromotionMenu pawnPromotionMove={pawnPromotionMove} onPromotionChoice={onPromotionChoice} onPromotionCancel={onPromotionCancel} />
  );
};

export default ChessPawnPromotionChoice;