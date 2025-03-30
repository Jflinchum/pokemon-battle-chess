import { Square } from 'chess.js';
import { ChessBoardSquare } from '../types';
import { getSquareColor, getSquareFromIndices } from '../util';
import ChessSquare from './ChessSquare/ChessSquare';
import './ChessBoard.css';
import { PokemonBattleChessManager } from '../../PokemonManager/PokemonBattleChessManager';
import { useGameState } from '../../../../context/GameStateContext';

interface ChessBoardProps {
  boardState: ChessBoardSquare[][],
  onSquareClick: (arg0: Square) => void,
  highlightedSquares: Square[],
  selectedSquare: Square | null,
  pokemonManager: PokemonBattleChessManager,
}

const ChessBoard = ({ boardState, onSquareClick, highlightedSquares, selectedSquare, pokemonManager }: ChessBoardProps) => {
  const { gameState } = useGameState();

  const boardColumnPerspective = (squares: ChessBoardSquare[][]) => {
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
                square={{...boardSquare, square: getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex)} as ChessBoardSquare}
                backgroundColor={getSquareColor(normalizedRowIndex(rowIndex), columnIndex)}
                onClick={(square) => {
                  onSquareClick(square?.square || getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex));
                }}
                highlighted={highlightedSquares.includes(getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex))}
                selected={selectedSquare === getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex)}
                pokemon={pokemonManager.getPokemonFromSquare(getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex))?.pkmn}
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