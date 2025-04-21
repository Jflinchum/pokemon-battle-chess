import { useMemo, useState, useEffect } from 'react';
import { Chess, Color, Square } from 'chess.js';
import { PokemonSet, SideID } from '@pkmn/data';
import { ArgType, KWArgType } from '@pkmn/protocol';
import { PokemonBattleChessManager } from '../../../../shared/models/PokemonBattleChessManager';
import ChessManager from '../ChessManager/ChessManager';
import PokemonBattleManager from '../PokemonManager/PokemonBattleManager/PokemonBattleManager';
import DraftPokemonManager from '../DraftPokemonManager/DraftPokemonManager';
import { useUserState } from '../../../context/UserStateContext';
import { useGameState } from '../../../context/GameStateContext';
import { useModalState } from '../../../context/ModalStateContext';
import { getCastledRookSquare, getVerboseSanChessMove, mergeBoardAndPokemonState } from '../ChessManager/util';
import { socket } from '../../../socket';
import { ChessData, MatchHistory } from '../../../../shared/types/game';
import PlayerInGameDisplay from './PlayerInGameDisplay/PlayerInGameDisplay';
import useBattleHistory from './useBattleHistory';
import Spinner from '../../common/Spinner/Spinner';
import { Timer } from '../../../../shared/types/game';
import './BattleChessManager.css';

export interface CurrentBattle {
  p1Pokemon: PokemonSet;
  p2Pokemon: PokemonSet;
  attemptedMove: { san: string, color: Color };
  offensivePlayer: SideID;
}

function BattleChessManager({ matchHistory, timers }: { matchHistory?: MatchHistory, timers?: Timer }) {
  const { userState } = useUserState();
  const { dispatch: modalStateDispatch } = useModalState();
  const { gameState, dispatch } = useGameState();

  // TODO - these don't need to be recalc'd every time player list changes
  const player1 = useMemo(() => gameState.players.find((player) => player.isPlayer1), [gameState.players]);
  const player2 = useMemo(() => gameState.players.find((player) => player.isPlayer2), [gameState.players]);
  const whitePlayer = useMemo(() => gameState.players.find((player) => player.color === 'w'), [gameState.players]);
  const blackPlayer = useMemo(() => gameState.players.find((player) => player.color === 'b'), [gameState.players]);
  const thisPlayer = useMemo(() => gameState.players.find((player) => player.playerId === userState.id), [gameState.players])
  const color = useMemo(() => gameState.gameSettings!.color, [])
  const chessManager = useMemo(() => {
    return new Chess();
  }, []);
  const pokemonManager = useMemo(() => {
    return new PokemonBattleChessManager(gameState.gameSettings.seed!, gameState.gameSettings.options.format);
  }, []);

  const [currentBattle, setCurrentBattle] = useState<CurrentBattle | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [board, setBoard] = useState(chessManager.board());
  // pokemon chess board TODO rename
  const [currentBoard, setCurrentBoard] = useState(mergeBoardAndPokemonState(chessManager.board(), pokemonManager));
  const [isDrafting, setIsDrafting] = useState<boolean>(gameState.gameSettings.options.format === 'draft');
  const [draftTurnPick, setDraftTurnPick] = useState<Color>('w');
  const [mostRecentMove, setMostRecentMove] = useState<{ from: Square, to: Square } | null>(null);
  const [currentPokemonMoveHistory, setCurrentPokemonMoveHistory] = useState<{ args: ArgType, kwArgs: KWArgType }[]>([]);

  const { catchingUp, currentMatchLog } = useBattleHistory({
    matchHistory,
    currentBattle,
    onBan: (draftPokemonIndex) => {
      pokemonManager.banDraftPiece(draftPokemonIndex);
      setDraftTurnPick((curr) =>  curr === 'w' ? 'b' : 'w');
    },
    onDraft: (square, draftPokemonIndex, color) => {
      const chessSquare = chessManager.get(square)!;
      pokemonManager.assignPokemonToSquare(draftPokemonIndex, square, chessSquare.type, color)
      setCurrentBoard(mergeBoardAndPokemonState(currentBoard, pokemonManager));
      setDraftTurnPick((curr) =>  curr === 'w' ? 'b' : 'w');
      setIsDrafting(!!pokemonManager.draftPieces.length);
    },
    onMove: (sanMove, moveFailed) => {
      handleMove({ sanMove, moveFailed });
    },
    onPokemonBattleStart: (p1Pokemon, p2Pokemon, attemptedMove) => {
      setCurrentPokemonMoveHistory([]);
      setCurrentBattle({
        p1Pokemon: color === 'b' ? p2Pokemon : p1Pokemon,
        p2Pokemon: color === 'b' ? p1Pokemon : p2Pokemon,
        attemptedMove,
        offensivePlayer: chessManager.turn() === 'w' ? 'p1' : 'p2'
      });
      if (gameState.isSkippingAhead) {
        setBattleStarted(true);
      } else {
        setTimeout(() => {
          setBattleStarted(true);
        }, 1000);
      }
    },
    onPokemonBattleOutput: (parsedChunk) => {
      if (parsedChunk.args[0] === 'win') {
        setBattleStarted(false);
        setCurrentPokemonMoveHistory([]);

        if (gameState.isSkippingAhead) {
          setCurrentBattle(null);
        } else {
          setTimeout(() => {
            setCurrentBattle(null);
          }, 1000);
        }
      }
      setCurrentPokemonMoveHistory((curr) => [...curr, parsedChunk]);
    },
    onGameEnd: (color, reason) => {
      modalStateDispatch({ type: 'OPEN_END_GAME_MODAL', payload: { modalProps: { victor: color, reason } } })
      dispatch({ type: 'END_MATCH' });
    },
    skipToEndOfSync: gameState.isSkippingAhead,
  });

  useEffect(() => {
    if (!catchingUp && gameState.isSkippingAhead) {
      dispatch({ type: 'SET_SKIPPING_AHEAD', payload: false });
    }
  }, [catchingUp]);

  useEffect(() => {
    dispatch({ type: 'SET_CATCHING_UP', payload: catchingUp });
  }, [catchingUp]);

  const handleMove = ({ sanMove, moveFailed }: { sanMove: string; moveFailed?: boolean }) => {
    let castledRookSquare;

    const verboseChessMove = getVerboseSanChessMove(sanMove, chessManager)!;
    const fromSquare = verboseChessMove.from;
    const toSquare = verboseChessMove.to;
    const promotion = verboseChessMove.promotion;

    if (verboseChessMove?.isKingsideCastle() || verboseChessMove?.isQueensideCastle()) {
      castledRookSquare = getCastledRookSquare(verboseChessMove.color, verboseChessMove?.isKingsideCastle());
    }
    const fromCastledRookSquare = castledRookSquare?.from;
    const toCastledRookSquare = castledRookSquare?.to;

    let capturedPieceSquare;
    if (verboseChessMove.isEnPassant()) {
      capturedPieceSquare = `${verboseChessMove.to[0] + (parseInt(verboseChessMove.to[1]) + (verboseChessMove.color === 'w' ? -1 : 1))}` as Square;
    } else if (verboseChessMove.isCapture()) {
      capturedPieceSquare = verboseChessMove.to;  
    }
    
    if (moveFailed && capturedPieceSquare) {
      pokemonManager.getPokemonFromSquare(verboseChessMove.from)!.square = null;
      const tempPiece = chessManager.get(capturedPieceSquare);
      chessManager.move(sanMove, { continueOnCheck: true });
      chessManager.remove(verboseChessMove.to);
      chessManager.put(tempPiece!, capturedPieceSquare);
    } else {
      chessManager.move({ from: fromSquare, to: toSquare, promotion }, { continueOnCheck: true });
      pokemonManager.movePokemonToSquare(fromSquare, toSquare);
    }


    if (fromCastledRookSquare && toCastledRookSquare) {
      pokemonManager.movePokemonToSquare(fromCastledRookSquare, toCastledRookSquare);
    }

    setMostRecentMove({ from: fromSquare, to: toSquare });
    setBoard(chessManager.board());
  }

  const validateDraftPick = ((square: Square, draftColor: Color) => {
    if (draftTurnPick !== color || thisPlayer?.isSpectator) {
      return false;
    }
    const chessSquare = chessManager.get(square);
    return (chessSquare && chessSquare.color === draftColor && chessSquare.type && !pokemonManager.getPokemonFromSquare(square));
  });

  const battleSquare = useMemo(() => {
    if (currentBattle?.attemptedMove.san) {
      const chessMove = getVerboseSanChessMove(currentBattle?.attemptedMove.san, chessManager);
      if (chessMove) {
        if (chessMove.isEnPassant()) {
          return `${chessMove.to[0] + (parseInt(chessMove.to[1]) + (chessMove.color === 'w' ? -1 : 1))}` as Square;
        } else {
          return chessMove.to;  
        }
      }
    }
  }, [currentBattle]);

  /**
   * Rendering the three different states of the game
   * - Draft/ban phase
   * - Chess phase
   * - Pokemon battle phase
   */
  return (
    <div className='battleChessContainer'>
      <PlayerInGameDisplay
        player={color === 'w' ? blackPlayer : whitePlayer}
        takenChessPieces={pokemonManager.getTakenChessPieces(gameState.gameSettings.color === 'w' ? 'w' : 'b')}
        timer={color === 'w' ? timers?.black : timers?.white}
      />
      <div style={{ display: catchingUp && gameState.isSkippingAhead ? 'none' : 'block' }}>
        {
          battleStarted && currentBattle &&
          (
            <PokemonBattleManager
              p1Name={player1?.playerName!}
              p2Name={player2?.playerName!}
              p1Pokemon={currentBattle.p1Pokemon}
              p2Pokemon={currentBattle.p2Pokemon}
              currentPokemonMoveHistory={currentPokemonMoveHistory}
            />
          )
        }
        {
          !battleStarted && !isDrafting &&
          (
            <ChessManager
              chessManager={chessManager}
              pokemonManager={pokemonManager}
              mostRecentMove={mostRecentMove}
              currentBattle={currentBattle}
              chessMoveHistoryDisplay={currentMatchLog.filter((log) => log.type === 'chess') as ChessData[]}
              board={board}
              battleSquare={battleSquare}
              onMove={(san) => {
                if (thisPlayer?.isSpectator) {
                  return;
                }
                socket.emit('requestChessMove', { sanMove: san, roomId: userState.currentRoomId, playerId: userState.id });
              }}
            />
          )
        }
        {
          isDrafting && (
            <DraftPokemonManager
              draftTurnPick={draftTurnPick}
              chessManager={chessManager}
              pokemonManager={pokemonManager}
              boardState={currentBoard}
              onDraftPokemon={(sq, pkmnIndex) => {
                if (validateDraftPick(sq, color!)) {
                  socket.emit('requestDraftPokemon', { roomId: userState.currentRoomId, playerId: userState.id, square: sq, draftPokemonIndex: pkmnIndex });
                  setIsDrafting(!!pokemonManager.draftPieces.length);
                }
              }}
              onBanPokemon={(pkmnIndex) => {
                if (thisPlayer?.isSpectator) {
                  return;
                }
                socket.emit('requestDraftPokemon', { roomId: userState.currentRoomId, playerId: userState.id, draftPokemonIndex: pkmnIndex, isBan: true });
              }}
            />
          )
        }
      </div>
      {
        gameState.isCatchingUp && gameState.isSkippingAhead && (
          <div className='skipSpinnerContainer'>
            <Spinner />
            Skipping ahead...
          </div>
        )
      }
      <PlayerInGameDisplay
        player={color === 'w' ? whitePlayer : blackPlayer}
        takenChessPieces={pokemonManager.getTakenChessPieces(gameState.gameSettings.color === 'w' ? 'b' : 'w')}
        timer={color === 'w' ? timers?.white : timers?.black}
      />
    </div>
  )
}

export default BattleChessManager;
