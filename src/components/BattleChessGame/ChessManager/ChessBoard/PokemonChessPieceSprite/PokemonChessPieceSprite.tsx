import { GenderName } from "@pkmn/data";
import { Color, PieceSymbol } from "chess.js";
import { PokemonSet } from "@pkmn/data";
import { PokemonSprite } from "../../../../common/Pokemon/PokemonSprite/PokemonSprite";
import ChessPieceSprite from "../ChessPieceSprite/ChessPieceSprite";
import "./PokemonChessPieceSprite.css";

export interface PokemonChessPieceSpriteProps {
  chessPieceType?: PieceSymbol;
  chessPieceColor?: Color;
  pokemon?: PokemonSet;
  onDragStart?: (e: React.DragEvent) => void;
}

const PokemonChessPieceSprite = ({
  chessPieceType,
  chessPieceColor,
  pokemon,
  onDragStart,
}: PokemonChessPieceSpriteProps) => {
  if (!chessPieceType || !chessPieceColor) {
    return null;
  }

  return (
    <div
      draggable
      className="pieceSpriteContainer"
      onDragStart={onDragStart}
      data-testid="pokemon-chess-piece-container"
    >
      {chessPieceType && chessPieceColor && (
        <ChessPieceSprite
          type={chessPieceType}
          color={chessPieceColor}
          className="chessPiece"
          data-testid="pokemon-chess-piece"
        />
      )}
      {pokemon && (
        <PokemonSprite
          className="pokemonPieceSprite"
          pokemonIdentifier={pokemon.species}
          gender={pokemon.gender as GenderName}
          shiny={pokemon.shiny}
          useDiv
          data-testid="pokemon-chess-piece-pokemon-sprite"
        />
      )}
    </div>
  );
};

export default PokemonChessPieceSprite;
