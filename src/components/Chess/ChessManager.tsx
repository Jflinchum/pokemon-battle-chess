import { useState } from 'react'
import { Chess, Square } from 'chess.js';
import ChessBoard from './ChessBoard/ChessBoard';
import { PokemonBattleChessManager } from '../PokemonBattleManager/PokemonBattleChessManager';

const turnMapping = {
  'w': 'White',
  'b': 'Black',
};

interface ChessManagerProps {
  chessManager: Chess,
  pokemonManager: PokemonBattleChessManager,
}

const ChessManager = ({ chessManager, pokemonManager }: ChessManagerProps) => {
  const [board, setBoard] = useState(chessManager.board());

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [highlightedSquares, setHighlightedSquare] = useState<Square[]>([]);

  const cancelSelection = () => {
    setSelectedSquare(null);
    setHighlightedSquare([]);
  }

  const updateSelection = (square: Square) => {
    setSelectedSquare(square);
    const selectedSquareMoves = chessManager.moves({ square, piece: chessManager.get(square)?.type, verbose: true });
    setHighlightedSquare(selectedSquareMoves.map((squareMove) => squareMove.to) as Square[]);
  }

  const movePiece = (fromSquare: Square, toSquare: Square) => {
    if (pokemonManager.getPokemonFromSquare(toSquare)) {
      debugger;
      pokemonManager.startBattle(pokemonManager.getPokemonFromSquare(fromSquare)!, pokemonManager.getPokemonFromSquare(toSquare)!) 
    } else {
      chessManager.move({ from: fromSquare, to: toSquare });
      setBoard(chessManager.board());
      setHighlightedSquare([]);
      setSelectedSquare(null);
      pokemonManager.movePokemonToSquare(fromSquare, toSquare);
    }
  }

  /**
   * TODO: 
   *  - Set up context providers to handle pokemon manager state
   *  - Keep track of each "unique" piece and it's position on the board
   *    - What would I do about castling? Is there a smart way to keep track of each piece's movement
   *      - Castling is the only chess move that involves moving two pieces at once. Only one edge case
   *  - Assign a random pokemon set to each "unique" piece
   *  - When a piece attacks another, before the piece take step happens, decide if the piece is taken through battle
   */

  const handleSquareClick = (square: Square) => {
    // If there's no current selected square, or the clicked square isn't a valid move, then set the clicked square to the current selected square
    if (!selectedSquare || !chessManager.moves({ square: selectedSquare, piece: chessManager.get(selectedSquare)?.type, verbose: true }).some((move) => move.to === square)) {
      if (selectedSquare === square) {
        // Cancel the selection if it's the same as the already selected square
        cancelSelection();
      } else {
        // Set the current square in state and highlight any potential moves for that square
        updateSelection(square);
      }
    } else {
      // Employ the move that the current player is trying to do
      movePiece (selectedSquare, square);
    }
  };

  return (
    <div>
      <p>Current Turn: {turnMapping[chessManager.turn()]}</p>
      <p>Move Number: {chessManager.moveNumber()}</p>
      {chessManager.isCheck() && (<p>Check!</p>)}
      {chessManager.isCheckmate() && (<p>Checkmate! Gameover!</p>)}
      <ChessBoard pokemonManager={pokemonManager} boardState={board} onSquareClick={handleSquareClick} highlightedSquares={highlightedSquares} selectedSquare={selectedSquare} />
    </div>
  )
}

export default ChessManager;