import { useState, useMemo } from 'react'
import { Chess, Square, Move } from 'chess.js';
import ChessBoard from './ChessBoard/ChessBoard';
import { PokemonBattleChessManager } from '../PokemonManager/PokemonBattleChessManager';
import PokemonChessDetailsCard from '../PokemonManager/PokemonChessDetailsCard/PokemonChessDetailsCard';
import './ChessManager.css';
import { ChessBoardSquare, MoveAttempt } from './types';
import ChessPawnPromotionChoice from './ChessPawnPromotionChoice/ChessPawnPromotionChoice';
import { getVerboseChessMove, mergeBoardAndPokemonState } from './util';
import { useGameState } from '../../../context/GameStateContext';
import { CurrentBattle } from '../BattleChessManager/BattleChessManager';
import { PokemonSet } from '@pkmn/data';

interface ChessManagerProps {
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  mostRecentMove: { from: Square, to: Square } | null;
  currentBattle?: CurrentBattle | null;
  board: ChessBoardSquare[][];
  onMove: (san: string) => void;
  chessMoveHistoryDisplay: { sanMove: string, battleSuccess: boolean | null }[]
}

const ChessManager = ({ chessManager, pokemonManager, mostRecentMove, currentBattle, board, onMove, chessMoveHistoryDisplay }: ChessManagerProps) => {
  /**
   * TODO: 
   *  - Set up context providers to handle pokemon manager state
   */
  const { gameState } = useGameState();
  const color = useMemo(() => gameState.gameSettings!.color, [gameState])

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [hoveredPokemon, setHoveredPokemon] = useState<PokemonSet | null | undefined>(null);
  const [highlightedSquares, setHighlightedSquare] = useState<Square[]>([]);
  const [requestedPawnPromotion, setRequestedPawnPromotion] = useState<Move | null>(null);

  const cancelSelection = () => {
    setSelectedSquare(null);
    setHighlightedSquare([]);
  }

  const updateSelection = (square: Square) => {
    setSelectedSquare(square);
    const selectedSquareMoves = chessManager.moves({ square, piece: chessManager.get(square)?.type, verbose: true, continueOnCheck: true }).filter((move) => move.color === color);
    setHighlightedSquare(selectedSquareMoves.map((squareMove) => squareMove.to) as Square[]);
  }

  const movePiece = ({ fromSquare, toSquare, promotion }: MoveAttempt) => {
    const verboseChessMove = getVerboseChessMove(fromSquare, toSquare, chessManager, promotion);
    // Before attempting the move, ask the player for their pawn promotion choice
    if (verboseChessMove?.isPromotion() && !promotion) {
      setRequestedPawnPromotion(verboseChessMove);
      return;
    }
  
    if (!verboseChessMove) {
      return;
    }

    onMove(verboseChessMove.san)
    setSelectedSquare(null);
    setHighlightedSquare([]);
  }

  const handleSquareClick = (square: Square) => {
    setRequestedPawnPromotion(null);
    // If there's no current selected square, or the clicked square isn't a valid move, then set the clicked square to the current selected square
    if (selectedSquare === square) {
      // Cancel the selection if it's the same as the already selected square
      cancelSelection();
    } else {
      // Set the current square in state and highlight any potential moves for that square
      updateSelection(square);
    }
    if (selectedSquare && getVerboseChessMove(selectedSquare, square, chessManager)?.color === color) {
      movePiece({ fromSquare: selectedSquare, toSquare: square });
    }
  };

  const handlePokemonHover = (pkmn?: PokemonSet | null) => {
    setHoveredPokemon(pkmn); 
  }

  const handlePieceDrop = (square: Square) => {
    setRequestedPawnPromotion(null);
    if (selectedSquare && getVerboseChessMove(selectedSquare, square, chessManager)?.color === color) {
      movePiece({ fromSquare: selectedSquare, toSquare: square });
    }
  }

  const handlePieceDrag = (square: Square) => {
    setRequestedPawnPromotion(null);
    updateSelection(square);
  }

  return (
    <div>
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
      <div className='turnNotification'>
        {
          chessManager.turn() === gameState.gameSettings.color ?
          (<strong>Your turn to move!</strong>) :
          (<strong>Waiting for opponent...</strong>)
        }
      </div>
      <div className='chessGameContainer'>
        <ChessBoard
          boardState={mergeBoardAndPokemonState(board, pokemonManager)}
          onSquareClick={handleSquareClick}
          onPokemonHover={handlePokemonHover}
          onPieceDrag={handlePieceDrag}
          onPieceDrop={handlePieceDrop}
          highlightedSquares={highlightedSquares}
          selectedSquare={selectedSquare}
          mostRecentMove={mostRecentMove}
          currentBattle={currentBattle}
        />
        <PokemonChessDetailsCard
          chessMoveHistory={chessMoveHistoryDisplay}
          pokemon={
            hoveredPokemon ||
            pokemonManager.getPokemonFromSquare(selectedSquare)?.pkmn
          }
        />
      </div>
    </div>
  )
}

export default ChessManager;