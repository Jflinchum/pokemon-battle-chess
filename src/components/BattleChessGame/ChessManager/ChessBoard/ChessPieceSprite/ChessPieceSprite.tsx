import { PieceSymbol, Color } from "chess.js";
import blackPawn from "../../../../../assets/chessAssets/sprites/blackPawn.png";
import blackRook from "../../../../../assets/chessAssets/sprites/blackRook.png";
import blackKnight from "../../../../../assets/chessAssets/sprites/blackKnight.png";
import blackBishop from "../../../../../assets/chessAssets/sprites/blackBishop.png";
import blackQueen from "../../../../../assets/chessAssets/sprites/blackQueen.png";
import blackKing from "../../../../../assets/chessAssets/sprites/blackKing.png";
import whitePawn from "../../../../../assets/chessAssets/sprites/whitePawn.png";
import whiteRook from "../../../../../assets/chessAssets/sprites/whiteRook.png";
import whiteKnight from "../../../../../assets/chessAssets/sprites/whiteKnight.png";
import whiteBishop from "../../../../../assets/chessAssets/sprites/whiteBishop.png";
import whiteQueen from "../../../../../assets/chessAssets/sprites/whiteQueen.png";
import whiteKing from "../../../../../assets/chessAssets/sprites/whiteKing.png";

const getPieceImage = (pieceType: PieceSymbol, pieceColor: Color) => {
  if (pieceColor === "b") {
    switch (pieceType) {
      case "p":
        return blackPawn;
      case "r":
        return blackRook;
      case "n":
        return blackKnight;
      case "b":
        return blackBishop;
      case "q":
        return blackQueen;
      case "k":
        return blackKing;
    }
  } else {
    switch (pieceType) {
      case "p":
        return whitePawn;
      case "r":
        return whiteRook;
      case "n":
        return whiteKnight;
      case "b":
        return whiteBishop;
      case "q":
        return whiteQueen;
      case "k":
        return whiteKing;
    }
  }
};

interface ChessPieceSpriteProps extends React.HTMLAttributes<HTMLDivElement> {
  color: Color;
  type: PieceSymbol;
  className?: string;
}

const ChessPieceSprite = ({
  color,
  type,
  className,
  ...props
}: ChessPieceSpriteProps) => {
  return (
    <img src={getPieceImage(type, color)} className={className} {...props} />
  );
};

export default ChessPieceSprite;
