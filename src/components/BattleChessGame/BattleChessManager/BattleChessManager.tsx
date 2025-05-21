import { useMemo, useState, useEffect, useRef } from 'react';
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
import { ChessData, MatchHistory } from '../../../../shared/types/game';
import PlayerInGameDisplay from './PlayerInGameDisplay/PlayerInGameDisplay';
import useBattleHistory from './useBattleHistory';
import Spinner from '../../common/Spinner/Spinner';
import { Timer } from '../../../../shared/types/game';
import movePieceMP3 from '../../../assets/chessAssets/audio/movePiece.mp3';
import capturePieceMP3 from '../../../assets/chessAssets/audio/capturePiece.mp3';
import GameManagerActions from './GameManagerActions/GameManagerActions';
import { useMusicPlayer } from '../../../util/useMusicPlayer';
import PlayerList from '../../RoomManager/Room/PlayerList/PlayerList';
import { useSocketRequests } from '../../../util/useSocketRequests';
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

  const whitePlayer = gameState.gameSettings.whitePlayer;
  const blackPlayer = gameState.gameSettings.blackPlayer;
  const color = useMemo(() => gameState.gameSettings!.color, []);
  const chessManager = useMemo(() => {
    return new Chess();
  }, []);
  const pokemonManager = useMemo(() => {
    return new PokemonBattleChessManager({
      seed: gameState.gameSettings.seed!,
      format: gameState.gameSettings.options.format,
      weatherWars: gameState.gameSettings.options.weatherWars,
    });
  }, []);

  const [currentBattle, setCurrentBattle] = useState<CurrentBattle | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [board, setBoard] = useState(chessManager.board());
  const [currentPokemonBoard, setCurrentPokemonBoard] = useState(mergeBoardAndPokemonState(chessManager.board(), pokemonManager));
  const [isDrafting, setIsDrafting] = useState<boolean>(gameState.gameSettings.options.format === 'draft');
  const [draftTurnPick, setDraftTurnPick] = useState<Color>('w');
  const [mostRecentMove, setMostRecentMove] = useState<{ from: Square, to: Square } | null>(null);
  const [currentPokemonMoveHistory, setCurrentPokemonMoveHistory] = useState<{ args: ArgType, kwArgs: KWArgType }[]>([]);
  const [errorRecoveryAttempts, setErrorRecoveryAttempts] = useState(0);
  // The timeout to start/end the pokemon battle when initiating one.
  const battleTimeout = useRef<NodeJS.Timeout | null>(null);

  const { movePieceAudio, capturePieceAudio } = useMemo(() => {
    const movePieceAudio = new Audio(movePieceMP3);
    const capturePieceAudio = new Audio(capturePieceMP3);
    movePieceAudio.volume = userState.volumePreference.pieceVolume;
    capturePieceAudio.volume = userState.volumePreference.pieceVolume;
    return {
      movePieceAudio,
      capturePieceAudio,
    };
  }, [userState.volumePreference.pieceVolume]);

  useEffect(() => {
    if (gameState.matchEnded) {
      setBattleStarted(false);
      setCurrentBattle(null);
    }
  }, [gameState.matchEnded]);

  const { playRandomGlobalSong, playRandomBattleSong } = useMusicPlayer();

  const {
    requestChessMove,
    requestDraftPokemon,
    requestBanPokemon,
  } = useSocketRequests();

  const { catchingUp, currentMatchLog, resetMatchHistory } = useBattleHistory({
    matchHistory,
    currentBattle,
    onBan: (draftPokemonIndex) => {
      pokemonManager.banDraftPiece(draftPokemonIndex);
      setDraftTurnPick((curr) =>  curr === 'w' ? 'b' : 'w');
    },
    onDraft: (square, draftPokemonIndex, color) => {
      const chessSquare = chessManager.get(square)!;
      pokemonManager.assignPokemonToSquare(draftPokemonIndex, square, chessSquare.type, color)
      setCurrentPokemonBoard(mergeBoardAndPokemonState(chessManager.board(), pokemonManager));
      setDraftTurnPick((curr) =>  curr === 'w' ? 'b' : 'w');
      setIsDrafting(!!pokemonManager.draftPieces.length);
    },
    onMove: (sanMove, moveFailed) => {
      return handleMove({ sanMove, moveFailed });
    },
    onPokemonBattleStart: (p1Pokemon, p2Pokemon, attemptedMove) => {
      setCurrentPokemonMoveHistory([]);
      setCurrentBattle({
        p1Pokemon,
        p2Pokemon,
        attemptedMove,
        offensivePlayer: chessManager.turn() === 'w' ? 'p1' : 'p2'
      });
      if (gameState.isSkippingAhead) {
        setBattleStarted(true);
      } else {
        // Need to cancel this timeout when skip to current turn is clicked
        battleTimeout.current = setTimeout(() => {
          setBattleStarted(true);
        }, userState.animationSpeedPreference);
      }
    },
    onPokemonBattleOutput: (parsedChunk) => {
      if (parsedChunk.args[0] === 'win') {
        setBattleStarted(false);
        setCurrentPokemonMoveHistory([]);

        if (gameState.isSkippingAhead) {
          setCurrentBattle(null);
        } else {
          battleTimeout.current = setTimeout(() => {
            setCurrentBattle(null);
          }, userState.animationSpeedPreference);
        }
      }
      setCurrentPokemonMoveHistory((curr) => [...curr, parsedChunk]);
    },
    onWeatherChange: (squareModifiers) => {
      pokemonManager.setSquareModifiers(squareModifiers);
    },
    onGameEnd: (color, reason) => {
      modalStateDispatch({ type: 'OPEN_END_GAME_MODAL', payload: { modalProps: { victor: color, reason } } })
      dispatch({ type: 'END_MATCH' });
    },
    skipToEndOfSync: gameState.isSkippingAhead,
  });

  const handleError = (err: Error) => {
    if (errorRecoveryAttempts < 3) {
      console.log(`Encountered error: ${err.message}. Attempting resync.`);
      console.log(err.stack);
      chessManager.reset();
      pokemonManager.reset();
      resetMatchHistory();
      setErrorRecoveryAttempts((attempts) => ++attempts);
    } else {
      // Error toast message
      console.log('Max error recovery attempts reached.');
    }
  }

  useEffect(() => {
    dispatch({ type: 'SET_CATCHING_UP', payload: catchingUp });

    if (!catchingUp && gameState.isSkippingAhead) {
      dispatch({ type: 'SET_SKIPPING_AHEAD', payload: false });
    }
  }, [catchingUp]);

  /**
   * Clear out the timeout for starting and ending a battle if we start skipping ahead.
   * This is to prevent unintended side effects while we're not rendering anything.
   */
  useEffect(() => {
    if (gameState.isSkippingAhead && battleTimeout.current) {
      clearTimeout(battleTimeout.current);
    }
  }, [gameState.isSkippingAhead]);

  const handleMove = ({ sanMove, moveFailed }: { sanMove: string; moveFailed?: boolean }) => {
    let castledRookSquare;

    const verboseChessMove = getVerboseSanChessMove(sanMove, chessManager);

    if (!verboseChessMove) {
      const err = new Error('Verbose chess move undefined.');
      handleError(err);
      return err;
    }

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
      chessManager.remove(verboseChessMove.from);
      chessManager.forceAdvanceTurn();
    } else {
      try {
        chessManager.move({ from: fromSquare, to: toSquare, promotion }, { continueOnCheck: true });
      } catch (err) {
        handleError(err as Error);
        return err as Error;
      }
      pokemonManager.movePokemonToSquare(fromSquare, toSquare);
    }


    if (fromCastledRookSquare && toCastledRookSquare) {
      pokemonManager.movePokemonToSquare(fromCastledRookSquare, toCastledRookSquare);
    }

    if (chessManager.turn() === 'w') {
      pokemonManager.tickSquareModifiers();
    }
    setMostRecentMove({ from: fromSquare, to: toSquare });
    setBoard(chessManager.board());
    if (capturedPieceSquare) {
      capturePieceAudio.play();
    } else {
      movePieceAudio.play();
    }
  }

  const validateDraftPick = ((square: Square, draftColor: Color) => {
    if (draftTurnPick !== color || gameState.isSpectator) {
      return false;
    }
    const chessSquare = chessManager.get(square);
    return (chessSquare && chessSquare.color === draftColor && chessSquare.type && !pokemonManager.getPokemonFromSquare(square));
  });

  const battleSquare = useMemo(() => {
    if (currentBattle && (!catchingUp || userState.animationSpeedPreference >= 1000) && !gameState.isSkippingAhead) {
      playRandomBattleSong();
    } else {
      playRandomGlobalSong();
    }

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
   * - TODO - Remove key from chess manager. Hack to re-render chessmanager and display drafted pokemon
   */
  return (
    <>
      <div className='battleChessAndActionContainer'>
        <GameManagerActions matchHistory={currentMatchLog} />
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
                  p1Pokemon={color === 'w' ? currentBattle.p1Pokemon : currentBattle.p2Pokemon}
                  p2Pokemon={color === 'w' ? currentBattle.p2Pokemon : currentBattle.p1Pokemon}
                  currentPokemonMoveHistory={currentPokemonMoveHistory}
                  perspective={color === 'w' ? 'p1' : 'p2'}
                />
              )
            }
            <div style={{ display: !battleStarted && !isDrafting ? 'block' : 'none' }}>
              <ChessManager
                key={`${!isDrafting}`}
                chessManager={chessManager}
                pokemonManager={pokemonManager}
                mostRecentMove={mostRecentMove}
                currentBattle={currentBattle}
                chessMoveHistory={currentMatchLog.filter((log) => log.type === 'chess') as ChessData[]}
                board={board}
                battleSquare={battleSquare}
                onError={(err) => {
                  handleError(err);
                }}
                onMove={(san) => {
                  if (gameState.isSpectator) {
                    return;
                  }

                  requestChessMove(san);
                }}
              />
            </div>
            {
              isDrafting && (
                <DraftPokemonManager
                  draftTurnPick={draftTurnPick}
                  chessManager={chessManager}
                  pokemonManager={pokemonManager}
                  boardState={currentPokemonBoard}
                  onDraftPokemon={(sq, pkmnIndex) => {
                    if (validateDraftPick(sq, color!)) {
                      requestDraftPokemon(sq, pkmnIndex);
                      setIsDrafting(!!pokemonManager.draftPieces.length);
                    }
                  }}
                  onBanPokemon={(pkmnIndex) => {
                    if (gameState.isSpectator) {
                      return;
                    }
                    requestBanPokemon(pkmnIndex);
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

          <PlayerList players={gameState.players} className='battleChessPlayerList' />
        </div>
      </div>
    </>
  )
}

export default BattleChessManager;
