import { PokemonPiece } from "../../../../../shared/models/PokemonBattleChessManager";
import PokemonChessPieceSprite from "../ChessBoard/PokemonChessPieceSprite/PokemonChessPieceSprite";
import "./TakenChessPieces.css";

interface TakenChessPiecesProps {
  takenPieces: PokemonPiece[];
}

const TakenChessPieces = ({ takenPieces }: TakenChessPiecesProps) => {
  return (
    <div className="takenChessPiecesContainer">
      {takenPieces.map((piece, index) => (
        <div className="pieceContainer" key={index}>
          <PokemonChessPieceSprite
            type={piece.type}
            color={piece.color}
            pokemon={piece.pkmn}
          />
        </div>
      ))}
    </div>
  );
};

export default TakenChessPieces;
