import { Square } from 'chess.js';
import { PokemonChessBoardSquare } from '../types';
import { getSquareColor, getSquareFromIndices } from '../util';
import ChessSquare from './ChessSquare/ChessSquare';
import './ChessBoard.css';
import { useGameState } from '../../../../context/GameStateContext';

interface ChessBoardProps {
  boardState: PokemonChessBoardSquare[][],
  onSquareClick: (arg0: Square) => void,
  highlightedSquares: Square[],
  selectedSquare: Square | null,
}

const ChessBoard = ({ boardState, onSquareClick, highlightedSquares, selectedSquare }: ChessBoardProps) => {
  const { gameState } = useGameState();

  const boardColumnPerspective = (squares: PokemonChessBoardSquare[][]) => {
    if (gameState.gameSettings?.color === 'w') {
      return squares;
    } else{
      return [...squares].reverse();
    }
  }

  const normalizedRowIndex = (index: number) => {
    if (gameState.gameSettings?.color === 'w') {
      return index;
    } else {
      return (index - 7) * -1;
    }
  }

  return (
    <div>
    {
      boardColumnPerspective(boardState).map((boardRow, rowIndex) => (
        <div className="chessRow" key={rowIndex}>
          {
            boardRow.map((boardSquare, columnIndex) => (
              <ChessSquare
                key={columnIndex}
                square={{...boardSquare, square: getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex)} as PokemonChessBoardSquare}
                backgroundColor={getSquareColor(normalizedRowIndex(rowIndex), columnIndex)}
                onClick={(square) => {
                  onSquareClick(square?.square || getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex));
                }}
                highlighted={highlightedSquares.includes(getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex))}
                selected={selectedSquare === getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex)}
                pokemon={boardSquare?.pokemon}
              />
            ))
          }
        </div>
      ))
    }
    </div>
  )
}

export default ChessBoard;