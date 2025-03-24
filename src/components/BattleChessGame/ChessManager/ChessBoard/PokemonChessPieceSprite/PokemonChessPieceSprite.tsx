import { useState } from "react";
import ChessPieceSprite from "../ChessPieceSprite";
import { Sprites } from "@pkmn/img";
import { GenderName } from "@pkmn/data";
import { Color, PieceSymbol } from "chess.js";
import { PokemonSet } from "@pkmn/data";
import './PokemonChessPieceSprite.css';

interface PokemonChessPieceSpriteProps {
  type?: PieceSymbol
  color?: Color
  pokemon?: PokemonSet
  pokemonHighVis?: boolean
}

const PokemonChessPieceSprite = ({ type, color, pokemon, pokemonHighVis }: PokemonChessPieceSpriteProps) => {
  const [pokemonOpacity, setPokemonOpacity] = useState<number>(30);

  return (
    <div className='pieceSpriteContainer' onMouseEnter={() => setPokemonOpacity(80)} onMouseLeave={() => setPokemonOpacity(30)}>
      {
        type && color && (
          <ChessPieceSprite type={type} color={color} className='chessPiece' />
        )
      }
      {
        pokemon && (
          <img style={{ opacity: `${pokemonHighVis ? 100 : pokemonOpacity}%` }} src={Sprites.getPokemon(pokemon.species, { gender: pokemon.gender as GenderName }).url} className='pokemonPieceSprite'/>
        )
      }
    </div>
  )
}

export default PokemonChessPieceSprite;