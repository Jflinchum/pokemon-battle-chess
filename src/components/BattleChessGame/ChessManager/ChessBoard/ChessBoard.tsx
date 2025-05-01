import { PieceSymbol, Square } from 'chess.js';
import { PokemonChessBoardSquare } from '../types';
import { getSquareColor } from '../util';
import ChessSquare from './ChessSquare/ChessSquare';
import './ChessBoard.css';
import { useGameState } from '../../../../context/GameStateContext';
import { PokemonSet } from '@pkmn/data';

interface ChessBoardProps {
  boardState: PokemonChessBoardSquare[][];
  onSquareClick: (arg0: PokemonChessBoardSquare) => void;
  onSquareHover?: (arg0?: PokemonChessBoardSquare | null) => void;
  onPieceDrag: (arg0: PokemonChessBoardSquare) => void;
  onPieceDrop: (arg0: PokemonChessBoardSquare) => void;
  highlightedSquares: Square[];
  selectedSquare: Square | null;
  mostRecentMove?: { from: Square, to: Square } | null;
  preMoveQueue?: { from: Square, to: Square, promotion?: PieceSymbol }[];
  battleSquare?: Square
}

const ChessBoard = ({
  boardState,
  onSquareClick,
  onSquareHover,
  onPieceDrag,
  onPieceDrop,
  highlightedSquares,
  selectedSquare,
  mostRecentMove,
  preMoveQueue = [],
  battleSquare
}: ChessBoardProps) => {
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
    <div className='chessBoard'>
    {
      boardColumnPerspective(boardState).map((boardRow, rowIndex) => (
        <div className="chessRow" key={rowIndex}>
          {
            boardRow.map((boardSquare, columnIndex) => {
              return (
                <ChessSquare
                  key={columnIndex}
                  square={boardSquare}
                  backgroundColor={getSquareColor(normalizedRowIndex(rowIndex), columnIndex)}
                  onClick={(square) => {
                    onSquareClick(square);
                  }}
                  onSquareHover={onSquareHover}
                  onPieceDrag={(square) => {
                    onPieceDrag(square);
                  }}
                  onPieceDrop={(square) => {
                    onPieceDrop(square);
                  }}
                  possibleMove={highlightedSquares.includes(boardSquare.square)}
                  selected={selectedSquare === boardSquare.square}
                  mostRecentMove={
                    mostRecentMove?.from === boardSquare.square ||
                    mostRecentMove?.to === boardSquare.square
                  }
                  isPreMove={
                    !!preMoveQueue.find((premove) => 
                      boardSquare.square === premove.from ||
                      boardSquare.square === premove.to
                  )}
                  isBattleSquare={
                    (boardSquare.square === battleSquare) || false
                  }
                />
              );
            })
          }
        </div>
      ))
    }
    </div>
  )
}

export default ChessBoard;