import { PokemonPiece } from "../../../../../shared/models/PokemonBattleChessManager";
import PokemonChessPieceSprite from "../ChessBoard/PokemonChessPieceSprite/PokemonChessPieceSprite";
import "./TakenChessPieces.css";

export interface TakenChessPiecesProps {
  takenPieces: PokemonPiece[];
}

const TakenChessPieces = ({ takenPieces }: TakenChessPiecesProps) => {
  return (
    <div
      className="takenChessPiecesContainer"
      data-testid="taken-pieces-container"
    >
      {takenPieces.map((piece, index) => (
        <div
          className="pieceContainer"
          key={index}
          data-testid={`taken-piece-${piece.type}`}
        >
          <PokemonChessPieceSprite
            chessPieceType={piece.type}
            chessPieceColor={piece.color}
            pokemon={piece.pkmn}
          />
        </div>
      ))}
    </div>
  );
};

export default TakenChessPieces;
