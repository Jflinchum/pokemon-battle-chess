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
}

const PokemonChessPieceSprite = ({ type, color, pokemon }: PokemonChessPieceSpriteProps) => {

  return (
    <div className='pieceSpriteContainer'>
      {
        type && color && (
          <ChessPieceSprite type={type} color={color} className='chessPiece' />
        )
      }
      {
        pokemon && (
          <img src={Sprites.getPokemon(pokemon.species, { gender: pokemon.gender as GenderName }).url} className='pokemonPieceSprite'/>
        )
      }
    </div>
  )
}

export default PokemonChessPieceSprite;