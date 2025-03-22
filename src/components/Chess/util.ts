export const getSquareColor = (rowIndex: number, columnIndex: number): 'white' | 'black' => {
  return rowIndex % 2 ? columnIndex % 2 ? 'white' : 'black' : columnIndex % 2 ? 'black' : 'white';
}