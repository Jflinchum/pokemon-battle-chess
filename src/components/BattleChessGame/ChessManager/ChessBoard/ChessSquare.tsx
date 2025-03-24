import { useState } from 'react';
import { Sprites } from '@pkmn/img';
import { GenderName, PokemonSet } from '@pkmn/data';

import { ChessBoardSquare } from '../types';
import ChessPieceSprite from './ChessPieceSprite';

interface ChessSquareProps {
  square: ChessBoardSquare
  backgroundColor: 'white' | 'black'
  onClick: (arg0: ChessBoardSquare) => void
  highlighted: boolean
  selected: boolean
  pokemon?: PokemonSet
  pokemonHighVis: boolean
}


const ChessSquare = ({ square, backgroundColor, onClick, highlighted, selected, pokemon, pokemonHighVis }: ChessSquareProps) => {
  const [pokemonOpacity, setPokemonOpacity] = useState<number>(30);

  return (
    <div onMouseEnter={() => setPokemonOpacity(80)} onMouseLeave={() => setPokemonOpacity(30)} className={`chessSquare ${backgroundColor}ChessSquare ${highlighted ? 'highlighted' : ''} ${selected ? 'selected' : ''}`} onClick={() => { onClick(square) }}>
      {
        square?.type && square?.color && (
          <ChessPieceSprite type={square.type} color={square.color} className='chessPiece' />
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

export default ChessSquare;