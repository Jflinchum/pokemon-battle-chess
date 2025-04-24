import { PokemonSet } from '@pkmn/data';
import { ChessBoardSquare } from '../../types';
import PokemonChessPieceSprite from '../PokemonChessPieceSprite/PokemonChessPieceSprite';
import './ChessSquare.css';

interface ChessSquareProps {
  square: ChessBoardSquare;
  backgroundColor: 'white' | 'black';
  onClick: (arg0: ChessBoardSquare) => void;
  onPokemonHover?: (arg0?: PokemonSet | null) => void;
  onPieceDrop: (arg0: ChessBoardSquare) => void;
  onPieceDrag: (arg0: ChessBoardSquare) => void;
  possibleMove: boolean;
  selected: boolean;
  mostRecentMove: boolean;
  isPreMove: boolean;
  isBattleSquare: boolean;
  pokemon?: PokemonSet
}

const getSquareHighlightClass = (selected: boolean, possibleMove: boolean, mostRecentMove: boolean, isBattleSquare: boolean, isPremove: boolean) => { 
  if (selected) {
    return 'selected';
  } else if (isBattleSquare) {
    return 'battleSquare'; 
  } else if (possibleMove) {
    return 'highlighted';
  } else if (isPremove) {
    return 'premove';
  } else if (mostRecentMove) {
    return 'mostRecentMove';
  }
  return '';
}


const ChessSquare = ({
  square,
  backgroundColor,
  onPieceDrop,
  onPieceDrag,
  onClick,
  onPokemonHover,
  possibleMove,
  selected,
  pokemon,
  mostRecentMove,
  isPreMove,
  isBattleSquare
}: ChessSquareProps) => {
  return (
    <div 
      id={`chessSquare-${square?.square}`}
      className={`chessSquare ${backgroundColor}ChessSquare`}
      onMouseEnter={() => {
        onPokemonHover?.(pokemon);
      }}
      onMouseLeave={() => {
        onPokemonHover?.(null);
      }}
      onClick={() => { onClick(square); }}
      onDrop={() => {
        onPieceDrop(square);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <div className={`squareColorFilter ${getSquareHighlightClass(selected, possibleMove, mostRecentMove, isBattleSquare, isPreMove)} ${(pokemon || square?.type) ? 'pieceSquare' : ''}`} />
      <PokemonChessPieceSprite
        type={square?.type}
        color={square?.color}
        pokemon={pokemon}
        onDragStart={() => {
          onPieceDrag(square);
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