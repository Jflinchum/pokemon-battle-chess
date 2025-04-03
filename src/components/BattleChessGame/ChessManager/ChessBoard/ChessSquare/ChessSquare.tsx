import { PokemonSet } from '@pkmn/data';
import { ChessBoardSquare } from '../../types';
import PokemonChessPieceSprite from '../PokemonChessPieceSprite/PokemonChessPieceSprite';
import './ChessSquare.css';

interface ChessSquareProps {
  square: ChessBoardSquare
  backgroundColor: 'white' | 'black'
  onClick: (arg0: ChessBoardSquare) => void
  possibleMove: boolean
  selected: boolean
  mostRecentMoveFrom: boolean
  mostRecentMoveTo: boolean
  pokemon?: PokemonSet
}

const getSquareHighlightClass = (selected: boolean, possibleMove: boolean, mostRecentMoveFrom: boolean, mostRecentMoveTo: boolean) => { 
  if (selected) {
    return 'selected';
  } else if (possibleMove) {
    return 'highlighted';
  } else if (mostRecentMoveFrom || mostRecentMoveTo) {
    return 'mostRecentMove';
  }
  return ''
}


const ChessSquare = ({ square, backgroundColor, onClick, possibleMove, selected, pokemon, mostRecentMoveFrom, mostRecentMoveTo }: ChessSquareProps) => {
  return (
    <div 
      className={`chessSquare ${backgroundColor}ChessSquare`}
      onClick={() => { onClick(square); }}
      onDrop={() => {
        onClick(square);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <div className={`squareColorFilter ${getSquareHighlightClass(selected, possibleMove, mostRecentMoveFrom, mostRecentMoveTo)}`} />
      <PokemonChessPieceSprite
        type={square?.type}
        color={square?.color}
        pokemon={pokemon}
        onDragStart={() => {
          onClick(square);
        }}
      />
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