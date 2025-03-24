import { useState, useEffect } from 'react'
import { Chess, PieceSymbol, Square, Move } from 'chess.js';
import ChessBoard from './ChessBoard/ChessBoard';
import { PokemonBattleChessManager } from '../PokemonManager/PokemonBattleChessManager';
import { CurrentBattle } from '../BattleChessManager/BattleChessManager';
import PokemonDetailsCard from '../PokemonManager/PokemonDetailsCard/PokemonDetailsCard';
import './ChessManager.css';
import { MoveAttempt } from './types';
import ChessPawnPromotionChoice from './ChessPawnPromotionChoice/ChessPawnPromotionChoice';
import TakenChessPieces from './TakenChessPieces/TakenChessPieces';

const turnMapping = {
  'w': 'White',
  'b': 'Black',
};

interface ChessManagerProps {
  chessManager: Chess,
  pokemonManager: PokemonBattleChessManager,
  onAttemptMove: (attemptedMove: MoveAttempt) => void;
  currentPokemonBattle: CurrentBattle | null
}

const ChessManager = ({ chessManager, pokemonManager, onAttemptMove, currentPokemonBattle }: ChessManagerProps) => {
  const [board, setBoard] = useState(chessManager.board());

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [highlightedSquares, setHighlightedSquare] = useState<Square[]>([]);
  const [pokemonHighVis, setPokemonHighVis] = useState(false);
  const [requestedPawnPromotion, setRequestedPawnPromotion] = useState<Move | null>(null);

  useEffect(() => {
    if (currentPokemonBattle) {
      // UI on Chess board indicating current battle
    } else {
      setBoard(chessManager.board());
      setHighlightedSquare([]);
      setSelectedSquare(null);
    }
  }, [currentPokemonBattle]);

  const getVerboseChessMove = (fromSquare: Square, toSquare: Square) => {
    return chessManager.moves({ square: fromSquare, piece: chessManager.get(fromSquare)?.type, verbose: true }).find((move) => move.to === toSquare);
  }

  const cancelSelection = () => {
    setSelectedSquare(null);
    setHighlightedSquare([]);
  }

  const updateSelection = (square: Square) => {
    setSelectedSquare(square);
    const selectedSquareMoves = chessManager.moves({ square, piece: chessManager.get(square)?.type, verbose: true });
    setHighlightedSquare(selectedSquareMoves.map((squareMove) => squareMove.to) as Square[]);
  }

  const movePiece = (fromSquare: Square, toSquare: Square, promotion?: PieceSymbol) => {
    let capturedPieceSquare;
    const verboseChessMove = getVerboseChessMove(fromSquare, toSquare);
    if (verboseChessMove?.isPromotion() && !promotion) {
      // Before attempting the move, ask the player for their pawn promotion choice
      setRequestedPawnPromotion(verboseChessMove);
      return;
    } else if (verboseChessMove?.isPromotion() && promotion) {
      setRequestedPawnPromotion(null);
    }
    
    if (verboseChessMove?.isEnPassant()) {
      capturedPieceSquare = `${verboseChessMove.to[0] + (parseInt(verboseChessMove.to[1]) + (verboseChessMove.color === 'w' ? -1 : 1))}` as Square;
    } else if (verboseChessMove?.isCapture()) {
      capturedPieceSquare = toSquare;  
    }
    onAttemptMove({ fromSquare, toSquare, promotion, capturedPieceSquare });
    setBoard(chessManager.board());
    setHighlightedSquare([]);
    setSelectedSquare(null);
  }

  /**
   * TODO: 
   *  - Set up context providers to handle pokemon manager state
   *  - Show pieces taken with pokemon sprites
   *  - Keep track of each "unique" piece and it's position on the board
   *    - What would I do about castling? Is there a smart way to keep track of each piece's movement
   *      - Castling is the only chess move that involves moving two pieces at once. Only one edge case
   */

  const handleSquareClick = (square: Square) => {
    // Ignore inputs if ongoing pokemon battle
    if (currentPokemonBattle) {
      return;
    }
    setRequestedPawnPromotion(null);
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
      movePiece(selectedSquare, square);
    }
  };

  return (
    <div>
      <p>Current Turn: {turnMapping[chessManager.turn()]}</p>
      <p>Move Number: {chessManager.moveNumber()}</p>
      <button onClick={() => setPokemonHighVis(!pokemonHighVis)}>Toggle Higher Visibility</button>
      {requestedPawnPromotion && (
        <ChessPawnPromotionChoice
          color={requestedPawnPromotion.color}
          onPromotionCancel={() => {
            setRequestedPawnPromotion(null);
            setHighlightedSquare([]);
            setSelectedSquare(null);
          }}
          onPromotionChoice={(type) => {
            movePiece(requestedPawnPromotion.from, requestedPawnPromotion.to, type);
          }}
        />
      )}
      {chessManager.isCheck() && (<p>Check!</p>)}
      {chessManager.isCheckmate() && (<p>Checkmate! Gameover!</p>)}
      <TakenChessPieces pokemonManager={pokemonManager} color='w' />
      <div className='chessGameContainer'>
        <ChessBoard pokemonHighVis={pokemonHighVis} pokemonManager={pokemonManager} boardState={board} onSquareClick={handleSquareClick} highlightedSquares={highlightedSquares} selectedSquare={selectedSquare} />
        {selectedSquare && pokemonManager.getPokemonFromSquare(selectedSquare) && <PokemonDetailsCard pokemon={pokemonManager.getPokemonFromSquare(selectedSquare)!.pkmn} />}
      </div>
      <TakenChessPieces pokemonManager={pokemonManager} color='b' />
    </div>
  )
}

export default ChessManager;