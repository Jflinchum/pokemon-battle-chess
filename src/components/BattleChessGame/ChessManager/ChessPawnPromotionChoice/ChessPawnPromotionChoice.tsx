import { Color, PieceSymbol } from "chess.js";
import { allPieceTypes } from "../constants";
import ChessPieceSprite from "../ChessBoard/ChessPieceSprite/ChessPieceSprite";
import './ChessPawnPromotionChoice.css'

interface ChessPawnPromotionChoiceProps {
  color: Color;
  onPromotionChoice: (chosenPiece: PieceSymbol) => void;
  onPromotionCancel: () => void;
}

const ChessPawnPromotionChoice = ({ color, onPromotionChoice, onPromotionCancel }: ChessPawnPromotionChoiceProps) => {
  return (
    <div>
      {
        allPieceTypes.filter((p) => p !== 'p' && p !== 'k').map((piece) => (
          <button key={piece} className='chessPiecePromotionButton' onClick={() => onPromotionChoice(piece)}>
            <ChessPieceSprite type={piece} color={color} />
          </button>
        ))
      }
      <button onClick={onPromotionCancel}>Cancel</button>
    </div>
  );
};

export default ChessPawnPromotionChoice;