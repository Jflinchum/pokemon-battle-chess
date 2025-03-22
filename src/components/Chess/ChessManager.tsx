import { useState, useEffect, useMemo } from 'react'
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard/ChessBoard';

const ChessManager = () => {
  const chessManager = useMemo(() => {
    return new Chess();
  }, []);

  const [board, setBoard] = useState(chessManager.board());

  return (
    <div>
      <ChessBoard boardState={board}/>
    </div>
  )
}

export default ChessManager;