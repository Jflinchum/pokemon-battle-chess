import { PokemonBattleChessManager } from "../../PokemonManager/PokemonBattleChessManager";
import { Color } from "chess.js";
import PokemonChessPieceSprite from "../ChessBoard/PokemonChessPieceSprite/PokemonChessPieceSprite";

interface TakenChessPiecesProps {
  pokemonManager: PokemonBattleChessManager,
  color: Color,
}

const TakenChessPieces = ({ pokemonManager, color }: TakenChessPiecesProps) => {
  const takenPieces = pokemonManager.getTakenChessPieces(color);
  return (
    <div>
      {
        takenPieces.map((piece, index) => (
          <PokemonChessPieceSprite key={index} type={piece.type} color={piece.color} pokemon={piece.pkmn} />
        ))
      }
    </div>
  );
};

export default TakenChessPieces;