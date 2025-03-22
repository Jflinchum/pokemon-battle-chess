import { useState, useEffect, useMemo } from 'react'
import { ChessBoardSquare } from '../types';
import { getSquareColor } from '../util';
import ChessSquare from './ChessSquare';
import './ChessBoard.css';

interface ChessBoardProps {
  boardState: ChessBoardSquare[][]
}

const ChessBoard = ({ boardState }: ChessBoardProps) => {

  return (
    <>
    {
      boardState.map((boardRow, rowIndex) => (
        <div className="chessRow">
          {
            boardRow.map((boardSquare, columnIndex) => (
              <ChessSquare square={boardSquare} backgroundColor={getSquareColor(rowIndex, columnIndex)} />
            ))
          }
        </div>
      ))
    }
    </>
  )
}

export default ChessBoard;