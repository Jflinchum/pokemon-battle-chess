import { Square } from 'chess.js';
import { PokemonChessBoardSquare } from '../types';
import { getSquareColor, getSquareFromIndices } from '../util';
import ChessSquare from './ChessSquare/ChessSquare';
import './ChessBoard.css';
import { useGameState } from '../../../../context/GameStateContext';
import { CurrentBattle } from '../../BattleChessManager/BattleChessManager';
import { PokemonSet } from '@pkmn/data';

interface ChessBoardProps {
  boardState: PokemonChessBoardSquare[][];
  onSquareClick: (arg0: Square) => void;
  onPokemonHover?: (arg0?: PokemonSet | null) => void;
  onPieceDrag: (arg0: Square) => void;
  onPieceDrop: (arg0: Square) => void;
  highlightedSquares: Square[];
  selectedSquare: Square | null;
  mostRecentMove?: { from: Square, to: Square } | null;
  currentBattle?: CurrentBattle | null;
}

const ChessBoard = ({ boardState, onSquareClick, onPokemonHover, onPieceDrag, onPieceDrop, highlightedSquares, selectedSquare, mostRecentMove, currentBattle }: ChessBoardProps) => {
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
                onPokemonHover={(pokemon) => {
                  onPokemonHover?.(pokemon);
                }}
                onPieceDrag={(square) => {
                  onPieceDrag(square?.square || getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex));
                }}
                onPieceDrop={(square) => {
                  onPieceDrop(square?.square || getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex));
                }}
                possibleMove={highlightedSquares.includes(getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex))}
                selected={selectedSquare === getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex)}
                pokemon={boardSquare?.pokemon}
                mostRecentMove={
                  mostRecentMove?.from === getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex) ||
                  mostRecentMove?.to === getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex)
                }
                isBattleSquare={
                  (boardSquare && boardSquare.square === currentBattle?.attemptedMove?.capturedPieceSquare) || false
                }
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