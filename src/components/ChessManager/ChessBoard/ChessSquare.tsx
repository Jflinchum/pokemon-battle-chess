import { PieceSymbol, Color } from 'chess.js';
import { Sprites } from '@pkmn/img';
import { GenderName, PokemonSet } from '@pkmn/data';

import { ChessBoardSquare } from '../types';
import blackPawn from '../../../assets/blackPawn.png';
import blackRook from '../../../assets/blackRook.png';
import blackKnight from '../../../assets/blackKnight.png';
import blackBishop from '../../../assets/blackBishop.png';
import blackQueen from '../../../assets/blackQueen.png';
import blackKing from '../../../assets/blackKing.png';
import whitePawn from '../../../assets/whitePawn.png';
import whiteRook from '../../../assets/whiteRook.png';
import whiteKnight from '../../../assets/whiteKnight.png';
import whiteBishop from '../../../assets/whiteBishop.png';
import whiteQueen from '../../../assets/whiteQueen.png';
import whiteKing from '../../../assets/whiteKing.png';

interface ChessSquareProps {
  square: ChessBoardSquare
  backgroundColor: 'white' | 'black'
  onClick: (arg0: ChessBoardSquare) => void
  highlighted: boolean
  selected: boolean
  pokemon?: PokemonSet
}

const getPieceImage = (pieceType: PieceSymbol, pieceColor: Color) => {
  if (pieceColor === 'b') {
    switch (pieceType) {
      case 'p': return blackPawn;
      case 'r': return blackRook;
      case 'n': return blackKnight;
      case 'b': return blackBishop;
      case 'q': return blackQueen;
      case 'k': return blackKing;
    }
  } else {
    switch (pieceType) {
      case 'p': return whitePawn;
      case 'r': return whiteRook;
      case 'n': return whiteKnight;
      case 'b': return whiteBishop;
      case 'q': return whiteQueen;
      case 'k': return whiteKing;
    }
  }
}

const ChessSquare = ({ square, backgroundColor, onClick, highlighted, selected, pokemon }: ChessSquareProps) => {
  return (
    <div className={`chessSquare ${backgroundColor}ChessSquare ${highlighted ? 'highlighted' : ''} ${selected ? 'selected' : ''}`} onClick={() => { onClick(square) }}>
      {
        square?.type && square?.color && (
          <img src={getPieceImage(square?.type, square?.color)} className='chessPiece' />
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

export default ChessSquare;