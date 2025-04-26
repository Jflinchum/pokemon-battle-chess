import { useState, useMemo, useEffect } from 'react'
import { Chess, Square, Move, PieceSymbol } from 'chess.js';
import { PokemonSet } from '@pkmn/data';
import ChessBoard from './ChessBoard/ChessBoard';
import { PokemonBattleChessManager } from '../../../../shared/models/PokemonBattleChessManager';
import PokemonChessDetailsCard from '../PokemonManager/PokemonChessDetailsCard/PokemonChessDetailsCard';
import { ChessBoardSquare, MoveAttempt } from './types';
import ChessPawnPromotionChoice from './ChessPawnPromotionChoice/ChessPawnPromotionChoice';
import { getVerboseChessMove, mergeBoardAndPokemonState } from './util';
import { useGameState } from '../../../context/GameStateContext';
import { CurrentBattle } from '../BattleChessManager/BattleChessManager';
import { useDebounce } from '../../../utils';
import { ChessData } from '../../../../shared/types/game';
import './ChessManager.css';

interface ChessManagerProps {
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  mostRecentMove: { from: Square, to: Square } | null;
  currentBattle?: CurrentBattle | null;
  board: ChessBoardSquare[][];
  onMove: (san: string) => void;
  chessMoveHistoryDisplay: ChessData[];
  battleSquare?: Square;
}

const ChessManager = ({
  chessManager,
  pokemonManager,
  mostRecentMove,
  battleSquare,
  board,
  onMove,
  chessMoveHistoryDisplay
}: ChessManagerProps) => {
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
  const [preMoveQueue, setPreMoveQueue] = useState<{ from: Square; to: Square; promotion?: PieceSymbol; }[]>([])

  // Create a simulated copy of both managers to handle premoving
  const { simulatedChessManager, simulatedPokemonManager } = useMemo(() => {
    const chessManagerCopy = new Chess(chessManager.fen(), { skipValidation: true });
    const pokemonManagerCopy = new PokemonBattleChessManager(null, null, JSON.parse(JSON.stringify(pokemonManager.getChessPieces())))

    if (chessManagerCopy.turn() !== color) {
      chessManagerCopy.forceAdvanceTurn();
    }

    let i = 0;
    for (; i < preMoveQueue.length; i++) {
      const preMove = preMoveQueue[i];
      const verboseMove = getVerboseChessMove(preMove.from, preMove.to, chessManagerCopy, preMove.promotion);
      if (verboseMove) {
        chessManagerCopy.move(preMove);
        pokemonManagerCopy.movePokemonToSquare(verboseMove.from, verboseMove.to, verboseMove.promotion);
        chessManagerCopy.forceAdvanceTurn();
      } else {
        break;
      }
    }
    // If we had to break early due to a move being invalid
    if (i !== preMoveQueue.length) {
      setPreMoveQueue((curr) => curr.slice(0, i));
    }

    return {
      simulatedChessManager: chessManagerCopy,
      simulatedPokemonManager: pokemonManagerCopy
    };
  }, [board, pokemonManager, preMoveQueue]);

  useEffect(() => {
    if (color === chessManager.turn() && preMoveQueue.length > 0) {
      const { from, to, promotion } = preMoveQueue[0];
      const verboseChessMove = getVerboseChessMove(from, to, chessManager, promotion);
      if (verboseChessMove) {
        setPreMoveQueue((curr) => curr.slice(1));
        onMove(verboseChessMove.san)
      } else {
        setPreMoveQueue([]);
      }
    }
  }, [board]);

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
    if (chessManager.turn() !== color) {
      const move = getVerboseChessMove(fromSquare, toSquare, simulatedChessManager, promotion);
      if (move) {
        setPreMoveQueue((curr) => [...curr, { from: move.from, to: move.to, promotion: move.promotion }]);
        setSelectedSquare(null);
        setHighlightedSquare([]);
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
    if (selectedSquare && getVerboseChessMove(selectedSquare, square, simulatedChessManager)?.color === color) {
      movePiece({ fromSquare: selectedSquare, toSquare: square });
    }
  };

  const handlePokemonHover = useDebounce((pkmn?: PokemonSet | null) => {
    setHoveredPokemon(pkmn);
  }, 100)

  const handlePieceDrop = (square: Square) => {
    setRequestedPawnPromotion(null);
    if (selectedSquare && getVerboseChessMove(selectedSquare, square, simulatedChessManager)?.color === color) {
      movePiece({ fromSquare: selectedSquare, toSquare: square });
    }
  }

  const handlePieceDrag = (square: Square) => {
    setRequestedPawnPromotion(null);
    updateSelection(square);
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

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
          (<strong>Your turn to move!</strong>) :
          (<strong>Waiting for opponent...</strong>)
        }
      </div>
      <div className='chessGameContainer'>
        <ChessBoard
          boardState={mergeBoardAndPokemonState(simulatedChessManager.board(), simulatedPokemonManager)}
          onSquareClick={handleSquareClick}
          onPokemonHover={handlePokemonHover}
          onPieceDrag={handlePieceDrag}
          onPieceDrop={handlePieceDrop}
          highlightedSquares={highlightedSquares}
          selectedSquare={selectedSquare}
          mostRecentMove={mostRecentMove}
          battleSquare={battleSquare}
          preMoveQueue={preMoveQueue}
        />
        <PokemonChessDetailsCard
          chessMoveHistory={chessMoveHistoryDisplay}
          pokemon={
            hoveredPokemon ||
            simulatedPokemonManager.getPokemonFromSquare(selectedSquare)?.pkmn
          }
        />
      </div>
    </div>
  )
}

export default ChessManager;