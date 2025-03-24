import { PokemonSet } from '@pkmn/data';
import { ChessBoardSquare } from '../types';
import PokemonChessPieceSprite from './PokemonChessPieceSprite/PokemonChessPieceSprite';

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

  return (
    <div className={`chessSquare ${backgroundColor}ChessSquare ${highlighted ? 'highlighted' : ''} ${selected ? 'selected' : ''}`} onClick={() => { onClick(square) }}>
      <PokemonChessPieceSprite type={square?.type} color={square?.color} pokemon={pokemon} pokemonHighVis={pokemonHighVis} />
    </div>
  )
}

export default ChessSquare;