import { PieceSymbol, Color } from 'chess.js';
import blackPawn from '../../../../../assets/chessAssets/blackPawn.png';
import blackRook from '../../../../../assets/chessAssets/blackRook.png';
import blackKnight from '../../../../../assets/chessAssets/blackKnight.png';
import blackBishop from '../../../../../assets/chessAssets/blackBishop.png';
import blackQueen from '../../../../../assets/chessAssets/blackQueen.png';
import blackKing from '../../../../../assets/chessAssets/blackKing.png';
import whitePawn from '../../../../../assets/chessAssets/whitePawn.png';
import whiteRook from '../../../../../assets/chessAssets/whiteRook.png';
import whiteKnight from '../../../../../assets/chessAssets/whiteKnight.png';
import whiteBishop from '../../../../../assets/chessAssets/whiteBishop.png';
import whiteQueen from '../../../../../assets/chessAssets/whiteQueen.png';
import whiteKing from '../../../../../assets/chessAssets/whiteKing.png';

const getPieceImage = (pieceType: PieceSymbol, pieceColor: Color) => {
  if (pieceColor === 'b') {
    switch (pieceType) {
      case 'p': return blackPawn;
      case 'r': return blackRook;
      case 'n': return blackKnight;
      case 'b': return blackBishop;
      case 'q': return blackQueen;
      case 'k': return blackKing;
    }
  } else {
    switch (pieceType) {
      case 'p': return whitePawn;
      case 'r': return whiteRook;
      case 'n': return whiteKnight;
      case 'b': return whiteBishop;
      case 'q': return whiteQueen;
      case 'k': return whiteKing;
    }
  }
};

interface ChessPieceSpriteProps {
  color: Color;
  type: PieceSymbol;
  className?: string;
}

const ChessPieceSprite = ({ color, type, className }: ChessPieceSpriteProps) => {

  return (
    <div style={{ backgroundImage: `url(${getPieceImage(type, color)})` }} className={className} />
  );
};

export default ChessPieceSprite