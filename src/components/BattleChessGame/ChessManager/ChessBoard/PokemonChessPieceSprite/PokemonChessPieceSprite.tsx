import ChessPieceSprite from "../ChessPieceSprite/ChessPieceSprite";
import { Sprites } from "@pkmn/img";
import { GenderName } from "@pkmn/data";
import { Color, PieceSymbol } from "chess.js";
import { PokemonSet } from "@pkmn/data";
import './PokemonChessPieceSprite.css';

interface PokemonChessPieceSpriteProps {
  type?: PieceSymbol
  color?: Color
  pokemon?: PokemonSet
  onDragStart?: (e: React.DragEvent) => void
}

const PokemonChessPieceSprite = ({ type, color, pokemon, onDragStart }: PokemonChessPieceSpriteProps) => {
  if (!type || !color) {
    return null;
  }

  return (
    <div
      draggable
      className='pieceSpriteContainer'
      onDragStart={onDragStart}
    >
      {
        type && color && (
          <ChessPieceSprite type={type} color={color} className='chessPiece' />
        )
      }
      {
        pokemon && (
          <div
            style={{ 'backgroundImage': `url(${Sprites.getPokemon(pokemon.species, { gender: pokemon.gender as GenderName }).url})`}}
            className='pokemonPieceSprite'
          />
        )
      }
    </div>
  )
}

export default PokemonChessPieceSprite;