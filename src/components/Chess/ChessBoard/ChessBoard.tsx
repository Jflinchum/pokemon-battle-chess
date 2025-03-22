import { Square } from 'chess.js';
import { ChessBoardSquare } from '../types';
import { getSquareColor, getSquareFromIndices } from '../util';
import ChessSquare from './ChessSquare';
import './ChessBoard.css';

interface ChessBoardProps {
  boardState: ChessBoardSquare[][],
  onSquareClick: (arg0: Square) => void,
  highlightedSquares: Square[],
}

const ChessBoard = ({ boardState, onSquareClick, highlightedSquares }: ChessBoardProps) => {

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