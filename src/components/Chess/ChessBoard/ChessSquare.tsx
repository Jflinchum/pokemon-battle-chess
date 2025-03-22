import { useState, useEffect, useMemo } from 'react'
import { ChessBoardSquare } from '../types';

interface ChessSquareProps {
  square: ChessBoardSquare,
  backgroundColor: 'white' | 'black'
}

const ChessSquare = ({ square, backgroundColor }: ChessSquareProps) => {

  return (
    <div className={`chessSquare ${backgroundColor}ChessSquare`}>
    </div>
  )
}

export default ChessSquare;