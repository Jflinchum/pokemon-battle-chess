import { useState, useMemo, useEffect } from 'react'
import { Chess, Square, Move } from 'chess.js';
import ChessBoard from './ChessBoard/ChessBoard';
import { PokemonBattleChessManager } from '../../../../shared/models/PokemonBattleChessManager';
import PokemonChessDetailsCard from '../PokemonManager/PokemonChessDetailsCard/PokemonChessDetailsCard';
import { ChessBoardSquare, MoveAttempt, PokemonChessBoardSquare } from './types';
import ChessPawnPromotionChoice from './ChessPawnPromotionChoice/ChessPawnPromotionChoice';
import { getVerboseChessMove, mergeBoardAndPokemonState } from './util';
import { useGameState } from '../../../context/GameStateContext';
import { CurrentBattle } from '../BattleChessManager/BattleChessManager';
import { useDebounce } from '../../../utils';
import { ChessData } from '../../../../shared/types/game';
import { usePremoves } from './usePremoves';
import './ChessManager.css';

interface ChessManagerProps {
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  mostRecentMove: { from: Square, to: Square } | null;
  currentBattle?: CurrentBattle | null;
  board: ChessBoardSquare[][];
  onMove: (san: string) => void;
  chessMoveHistory: ChessData[];
  battleSquare?: Square;
}

const ChessManager = ({
  chessManager,
  pokemonManager,
  mostRecentMove,
  battleSquare,
  board,
  onMove,
  chessMoveHistory
}: ChessManagerProps) => {
  /**
   * TODO: 
   *  - Set up context providers to handle pokemon manager state
   */
  const { gameState } = useGameState();
  const color = useMemo(() => gameState.gameSettings!.color, [gameState])

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<Square | null | undefined>(null);
  const [highlightedSquares, setHighlightedSquare] = useState<Square[]>([]);
  const [requestedPawnPromotion, setRequestedPawnPromotion] = useState<Move | null>(null);

  // Create a simulated copy of both managers to handle premoving
  const {
    simulatedChessManager,
    simulatedPokemonManager,
    preMoveQueue,
    setPreMoveQueue,
    resetSimulators,
    simulateMove,
    simulatedBoard,
  } = usePremoves(board, chessManager, pokemonManager);

  useEffect(() => {
    if (color === chessManager.turn() && preMoveQueue.length > 0) {
      const { from, to, promotion } = preMoveQueue[0];
      const verboseChessMove = getVerboseChessMove(from, to, chessManager, promotion);
      if (verboseChessMove) {
        setPreMoveQueue((curr) => curr.slice(1));
        onMove(verboseChessMove.san)
      } else {
        resetSimulators();
        setPreMoveQueue([]);
      }
    }
  }, [board]);

  useEffect(() => {
    const previousMove = chessMoveHistory[chessMoveHistory.length - 1];
    if (previousMove && previousMove.data.color === color && previousMove.data.failed) {
      resetSimulators();
      setPreMoveQueue([]);
    }
  }, [chessMoveHistory]);

  const cancelSelection = () => {
    setSelectedSquare(null);
    setHighlightedSquare([]);
  }

  const updateSelection = (square: Square) => {
    setSelectedSquare(square);

    const selectedSquareMoves = simulatedChessManager.moves({
      square,
      piece: simulatedChessManager.get(square)?.type,
      verbose: true,
      continueOnCheck: true
    }).filter((move) => move.color === color);
    setHighlightedSquare(selectedSquareMoves.map((squareMove) => squareMove.to) as Square[]);
  }

  const movePiece = ({ fromSquare, toSquare, promotion }: MoveAttempt) => {
    if (gameState.isSpectator) {
      return;
    }
    if (chessManager.turn() !== color) {
      const move = getVerboseChessMove(fromSquare, toSquare, simulatedChessManager, promotion);
      if (move) {
        if (move?.isPromotion() && !promotion) {
          setRequestedPawnPromotion(move);
          return;
        }
        simulateMove(move);
        setPreMoveQueue((curr) => [...curr, { from: move.from, to: move.to, promotion: move.promotion, san: move.san }]);
        setSelectedSquare(null);
        setHighlightedSquare([]);
        return;
      } else {
        return;
      }
    }
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

  const handleSquareClick = ({ square }: PokemonChessBoardSquare) => {
    setRequestedPawnPromotion(null);
    // If there's no current selected square, or the clicked square isn't a valid move, then set the clicked square to the current selected square
    if (selectedSquare === square) {
      // Cancel the selection if it's the same as the already selected square
      cancelSelection();
    } else {
      // Set the current square in state and highlight any potential moves for that square
      updateSelection(square);
    }
    if (selectedSquare && getVerboseChessMove(selectedSquare, square, simulatedChessManager)?.color === color) {
      movePiece({ fromSquare: selectedSquare, toSquare: square });
    }
  };

  const handleSquareHover = useDebounce((pkmnChessSquare?: PokemonChessBoardSquare | null) => {
    setHoveredSquare(pkmnChessSquare?.square);
  }, 100)

  const handlePieceDrop = ({ square }: PokemonChessBoardSquare) => {
    if (selectedSquare && getVerboseChessMove(selectedSquare, square, simulatedChessManager)?.color === color) {
      movePiece({ fromSquare: selectedSquare, toSquare: square });
    }
  }

  const handlePieceDrag = ({ square }: PokemonChessBoardSquare) => {
    setRequestedPawnPromotion(null);
    updateSelection(square);
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    resetSimulators();
    setPreMoveQueue([]);
  }

  return (
    <div className='gameContainer' onContextMenu={handleContextMenu}>
      {requestedPawnPromotion && (
        <ChessPawnPromotionChoice
          pawnPromotionMove={requestedPawnPromotion}
          onPromotionCancel={() => {
            setRequestedPawnPromotion(null);
            setHighlightedSquare([]);
            setSelectedSquare(null);
          }}
          onPromotionChoice={(type) => {
            setRequestedPawnPromotion(null);
            movePiece({ fromSquare: requestedPawnPromotion.from, toSquare: requestedPawnPromotion.to, promotion: type });
          }}
        />
      )}
      <div className='turnNotification'>
        {
          chessManager.turn() === gameState.gameSettings.color ?
          (<strong className='highPriorityNotification'>Your turn to move!</strong>) :
          (<strong>Waiting for opponent...</strong>)
        }
      </div>
      <div className='chessGameContainer'>
        <ChessBoard
          boardState={mergeBoardAndPokemonState(simulatedBoard, simulatedPokemonManager)}
          onSquareClick={handleSquareClick}
          onSquareHover={handleSquareHover}
          onPieceDrag={handlePieceDrag}
          onPieceDrop={handlePieceDrop}
          highlightedSquares={highlightedSquares}
          selectedSquare={selectedSquare}
          mostRecentMove={mostRecentMove}
          battleSquare={battleSquare}
          preMoveQueue={preMoveQueue}
        />
        <PokemonChessDetailsCard
          chessMoveHistory={chessMoveHistory}
          squareModifier={
            simulatedPokemonManager.getWeatherFromSquare(hoveredSquare) ||
            simulatedPokemonManager.getWeatherFromSquare(selectedSquare)
          }
          pokemon={
            simulatedPokemonManager.getPokemonFromSquare(hoveredSquare)?.pkmn ||
            simulatedPokemonManager.getPokemonFromSquare(selectedSquare)?.pkmn
          }
        />
      </div>
    </div>
  )
}

export default ChessManager;