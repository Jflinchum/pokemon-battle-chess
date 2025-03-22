import { Square } from "chess.js";

export const getSquareColor = (rowIndex: number, columnIndex: number): 'white' | 'black' => {
  return rowIndex % 2 ? columnIndex % 2 ? 'white' : 'black' : columnIndex % 2 ? 'black' : 'white';
}

export const getSquareFromIndices = (rowIndex: number, columnIndex: number): Square => {
  return String.fromCharCode(97 + columnIndex) + (8 - rowIndex) as Square;
}