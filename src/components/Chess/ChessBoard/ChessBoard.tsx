import { Square } from 'chess.js';
import { ChessBoardSquare } from '../types';
import { getSquareColor, getSquareFromIndices } from '../util';
import ChessSquare from './ChessSquare';
import './ChessBoard.css';
import { PokemonBattleChessManager } from '../../PokemonBattleManager/PokemonBattleChessManager';

interface ChessBoardProps {
  boardState: ChessBoardSquare[][],
  onSquareClick: (arg0: Square) => void,
  highlightedSquares: Square[],
  selectedSquare: Square | null,
  pokemonManager: PokemonBattleChessManager,
}

const ChessBoard = ({ boardState, onSquareClick, highlightedSquares, selectedSquare, pokemonManager }: ChessBoardProps) => {

  return (
    <>
    {
      boardState.map((boardRow, rowIndex) => (
        <div className="chessRow" key={rowIndex}>
          {
            boardRow.map((boardSquare, columnIndex) => (
              <ChessSquare
                key={columnIndex}
                square={boardSquare}
                backgroundColor={getSquareColor(rowIndex, columnIndex)}
                onClick={(square) => {
                  onSquareClick(square?.square || getSquareFromIndices(rowIndex, columnIndex));
                }}
                highlighted={highlightedSquares.includes(getSquareFromIndices(rowIndex, columnIndex))}
                selected={selectedSquare === getSquareFromIndices(rowIndex, columnIndex)}
                pokemon={pokemonManager.getPokemonFromSquare(getSquareFromIndices(rowIndex, columnIndex))}
              />
            ))
          }
        </div>
      ))
    }
    </>
  )
}

export default ChessBoard;