import { PokemonBattleChessManager } from "../../PokemonManager/PokemonBattleChessManager";
import { Color } from "chess.js";
import PokemonChessPieceSprite from "../ChessBoard/PokemonChessPieceSprite/PokemonChessPieceSprite";
import './TakenChessPieces.css';

interface TakenChessPiecesProps {
  pokemonManager: PokemonBattleChessManager,
  color: Color,
}

const TakenChessPieces = ({ pokemonManager, color }: TakenChessPiecesProps) => {
  const takenPieces = pokemonManager.getTakenChessPieces(color);
  return (
    <div className='takenChessPiecesContainer'>
      {
        takenPieces.map((piece, index) => (
          <div className='pieceContainer'>
            <PokemonChessPieceSprite key={index} type={piece.type} color={piece.color} pokemon={piece.pkmn} />
          </div>
        ))
      }
    </div>
  );
};

export default TakenChessPieces;