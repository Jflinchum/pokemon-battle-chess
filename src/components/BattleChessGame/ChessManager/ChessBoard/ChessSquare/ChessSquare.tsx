import { PokemonSet } from '@pkmn/data';
import { ChessBoardSquare } from '../../types';
import PokemonChessPieceSprite from '../PokemonChessPieceSprite/PokemonChessPieceSprite';
import './ChessSquare.css';

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
      {
        square?.square[0] === 'a' &&
        (
          <span className='squareText squareNum'>{square.square[1]}</span>
        )
      }
      {
        square?.square[1] === '1' &&
        (
          <span className='squareText squareChar'>{square.square[0]}</span>
        )
      }
    </div>
  )
}

export default ChessSquare;