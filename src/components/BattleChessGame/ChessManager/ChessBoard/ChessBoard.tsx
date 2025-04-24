import { PieceSymbol, Square } from 'chess.js';
import { PokemonChessBoardSquare } from '../types';
import { getSquareColor, getSquareFromIndices } from '../util';
import ChessSquare from './ChessSquare/ChessSquare';
import './ChessBoard.css';
import { useGameState } from '../../../../context/GameStateContext';
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
  preMoveQueue?: { from: Square, to: Square, promotion?: PieceSymbol }[];
  battleSquare?: Square
}

const ChessBoard = ({
  boardState,
  onSquareClick,
  onPokemonHover,
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
              const sqInd = getSquareFromIndices(normalizedRowIndex(rowIndex), columnIndex);
              return (
                <ChessSquare
                  key={columnIndex}
                  square={{...boardSquare, square: sqInd} as PokemonChessBoardSquare}
                  backgroundColor={getSquareColor(normalizedRowIndex(rowIndex), columnIndex)}
                  onClick={(square) => {
                    onSquareClick(square?.square || sqInd);
                  }}
                  onPokemonHover={(pokemon) => {
                    onPokemonHover?.(pokemon);
                  }}
                  onPieceDrag={(square) => {
                    onPieceDrag(square?.square || sqInd);
                  }}
                  onPieceDrop={(square) => {
                    onPieceDrop(square?.square || sqInd);
                  }}
                  possibleMove={highlightedSquares.includes(sqInd)}
                  selected={selectedSquare === sqInd}
                  pokemon={boardSquare?.pokemon}
                  mostRecentMove={
                    mostRecentMove?.from === sqInd ||
                    mostRecentMove?.to === sqInd
                  }
                  isPreMove={
                    !!preMoveQueue.find((premove) => 
                      sqInd === premove.from ||
                      sqInd === premove.to
                  )}
                  isBattleSquare={
                    (boardSquare && boardSquare.square === battleSquare) || false
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