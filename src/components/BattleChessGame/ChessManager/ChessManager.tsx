import { useState, useEffect, useMemo } from 'react'
import { Chess, Square, Move } from 'chess.js';
import ChessBoard from './ChessBoard/ChessBoard';
import { PokemonBattleChessManager } from '../PokemonManager/PokemonBattleChessManager';
import PokemonDetailsCard from '../PokemonManager/PokemonDetailsCard/PokemonDetailsCard';
import './ChessManager.css';
import { MoveAttempt } from './types';
import ChessPawnPromotionChoice from './ChessPawnPromotionChoice/ChessPawnPromotionChoice';
import TakenChessPieces from './TakenChessPieces/TakenChessPieces';
import { getCastledRookSquare, getVerboseChessMove, mergeBoardAndPokemonState } from './util';
import { useGameState } from '../../../context/GameStateContext';
import { socket } from '../../../socket';
import { useUserState } from '../../../context/UserStateContext';

interface ChessManagerProps {
  chessManager: Chess,
  pokemonManager: PokemonBattleChessManager,
  onAttemptMove: (attemptedMove: MoveAttempt) => void;
}

const ChessManager = ({ chessManager, pokemonManager, onAttemptMove }: ChessManagerProps) => {
  /**
   * TODO: 
   *  - Set up context providers to handle pokemon manager state
   */
  const { gameState } = useGameState();
  const { userState } = useUserState();
  const color = useMemo(() => gameState.gameSettings!.color, [gameState])
  const [board, setBoard] = useState(chessManager.board());

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [highlightedSquares, setHighlightedSquare] = useState<Square[]>([]);
  const [requestedPawnPromotion, setRequestedPawnPromotion] = useState<Move | null>(null);

  useEffect(() => {
    socket.on('startChessMove', ({ fromSquare, toSquare, promotion }) => {
      let capturedPieceSquare;
      let castledRookSquare;
      const verboseChessMove = getVerboseChessMove(fromSquare, toSquare, chessManager);

      if (verboseChessMove?.isEnPassant()) {
        capturedPieceSquare = `${verboseChessMove.to[0] + (parseInt(verboseChessMove.to[1]) + (verboseChessMove.color === 'w' ? -1 : 1))}` as Square;
      } else if (verboseChessMove?.isCapture()) {
        capturedPieceSquare = toSquare;  
      }

      if (verboseChessMove?.isKingsideCastle() || verboseChessMove?.isQueensideCastle()) {
        castledRookSquare = getCastledRookSquare(verboseChessMove.color, verboseChessMove?.isKingsideCastle());
      }
      onAttemptMove({
        fromSquare,
        toSquare,
        promotion,
        capturedPieceSquare,
        fromCastledRookSquare: castledRookSquare?.from,
        toCastledRookSquare: castledRookSquare?.to
      });
      setBoard(chessManager.board());
      setHighlightedSquare([]);
      setSelectedSquare(null);
      setRequestedPawnPromotion(null);
    });

    return () => {
      socket.off('startChessMove');
    }
  }, [])

  const cancelSelection = () => {
    setSelectedSquare(null);
    setHighlightedSquare([]);
  }

  const updateSelection = (square: Square) => {
    setSelectedSquare(square);
    const selectedSquareMoves = chessManager.moves({ square, piece: chessManager.get(square)?.type, verbose: true }).filter((move) => move.color === color);
    setHighlightedSquare(selectedSquareMoves.map((squareMove) => squareMove.to) as Square[]);
  }

  const movePiece = ({ fromSquare, toSquare, promotion }: MoveAttempt) => {
    const verboseChessMove = getVerboseChessMove(fromSquare, toSquare, chessManager);
    // Before attempting the move, ask the player for their pawn promotion choice
    if (verboseChessMove?.isPromotion() && !promotion) {
      setRequestedPawnPromotion(verboseChessMove);
      return;
    }
    socket.emit('requestChessMove', { fromSquare, toSquare, promotion, roomId: userState.currentRoomId, playerId: userState.id });
  }

  const handleSquareClick = (square: Square) => {
    setRequestedPawnPromotion(null);
    // If there's no current selected square, or the clicked square isn't a valid move, then set the clicked square to the current selected square
    if (!selectedSquare || !chessManager.moves({ square: selectedSquare, piece: chessManager.get(selectedSquare)?.type, verbose: true }).some((move) => (move.to === square && move.color === color))) {
      if (selectedSquare === square) {
        // Cancel the selection if it's the same as the already selected square
        cancelSelection();
      } else {
        // Set the current square in state and highlight any potential moves for that square
        updateSelection(square);
      }
    } else {
      // Employ the move that the current player is trying to do
      if (getVerboseChessMove(selectedSquare, square, chessManager)?.color === color) {
        movePiece({ fromSquare: selectedSquare, toSquare: square });
      }
    }
  };

  return (
    <div className='chessGameUI'>
      <p>Turn: {chessManager.moveNumber()}</p>
      {requestedPawnPromotion && (
        <ChessPawnPromotionChoice
          color={requestedPawnPromotion.color}
          onPromotionCancel={() => {
            setRequestedPawnPromotion(null);
            setHighlightedSquare([]);
            setSelectedSquare(null);
          }}
          onPromotionChoice={(type) => {
            movePiece({ fromSquare: requestedPawnPromotion.from, toSquare: requestedPawnPromotion.to, promotion: type });
          }}
        />
      )}
      <TakenChessPieces
        takenPieces={pokemonManager.getTakenChessPieces(gameState.gameSettings.color!)}
      />
      <div className='chessGameContainer'>
        <ChessBoard
          boardState={mergeBoardAndPokemonState(board, pokemonManager)}
          onSquareClick={handleSquareClick}
          highlightedSquares={highlightedSquares}
          selectedSquare={selectedSquare}
        />
        <PokemonDetailsCard
          pokemon={
            pokemonManager.getPokemonFromSquare(selectedSquare)?.pkmn
          }
        />
      </div>
      <TakenChessPieces
        takenPieces={pokemonManager.getTakenChessPieces(gameState.gameSettings.color === 'w' ? 'b' : 'w')}
      />
    </div>
  )
}

export default ChessManager;