import { useState, useEffect, useMemo } from 'react'
import { Chess, Square } from 'chess.js';
import ChessBoard from './ChessBoard/ChessBoard';
import { ChessBoardSquare } from './types';

const ChessManager = () => {
  const chessManager = useMemo(() => {
    return new Chess();
  }, []);

  const [board, setBoard] = useState(chessManager.board());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [highlightedSquares, setHighlightedSquare] = useState<Square[]>([])

  const handleSquareClick = (square: Square) => {
    // If there's no current selected square, or the clicked square isn't a valid move, then set the clicked square to the current selected square
    if (!selectedSquare || !chessManager.moves({ square: selectedSquare, piece: chessManager.get(selectedSquare)?.type, verbose: true }).some((move) => move.to === square)) {
      setSelectedSquare(square);
      const selectedSquareMoves = chessManager.moves({ square, piece: chessManager.get(square)?.type, verbose: true });
      setHighlightedSquare(selectedSquareMoves.map((squareMove) => squareMove.to) as Square[]);
    } else {
      chessManager.move({ from: selectedSquare, to: square });
      setBoard(chessManager.board());
      setHighlightedSquare([]);
    }
  };

  return (
    <div>
      <p>Current Turn: {chessManager.turn()}</p>
      <p>Move Number: {chessManager.moveNumber()}</p>
      {chessManager.isCheck() && (<p>Check!</p>)}
      {chessManager.isCheckmate() && (<p>Checkmate! Gameover!</p>)}
      <ChessBoard boardState={board} onSquareClick={handleSquareClick} highlightedSquares={highlightedSquares}/>
    </div>
  )
}

export default ChessManager;