import { useMemo, useState, useEffect } from 'react';
import { Chess, Color, Square } from 'chess.js';
import { PokemonBattleChessManager, PokemonPiece } from '../PokemonManager/PokemonBattleChessManager';
import ChessManager from '../ChessManager/ChessManager';
import PokemonBattleManager from '../PokemonManager/PokemonBattleManager/PokemonBattleManager';
import DraftPokemonManager from '../DraftPokemonManager/DraftPokemonManager';
import { MoveAttempt } from '../ChessManager/types';
import { useUserState } from '../../../context/UserStateContext';
import { useGameState } from '../../../context/GameStateContext';
import { getCastledRookSquare, getVerboseChessMove, getVerboseSanChessMove, mergeBoardAndPokemonState } from '../ChessManager/util';
import { useModalState } from '../../../context/ModalStateContext';
import { socket } from '../../../socket';
import './BattleChessManager.css';
import PlayerInGameDisplay from './PlayerInGameDisplay/PlayerInGameDisplay';
import { SideID } from '@pkmn/data';
import { MatchHistory } from '../../Room/RoomManager';
import useBattleHistory from './useBattleHistory';
import Spinner from '../../common/Spinner/Spinner';

export interface CurrentBattle {
  p1Pokemon: PokemonPiece;
  p2Pokemon: PokemonPiece;
  attemptedMove: MoveAttempt;
  offensivePlayer: SideID;
}

function BattleChessManager({ matchHistory }: { matchHistory?: MatchHistory }) {
  const { userState } = useUserState();
  const { dispatch: modalStateDispatch } = useModalState();
  const { gameState, dispatch } = useGameState();

  const player1 = useMemo(() => gameState.players.find((player) => player.isPlayer1), [gameState.players]);
  const player2 = useMemo(() => gameState.players.find((player) => player.isPlayer2), [gameState.players]);
  const whitePlayer = useMemo(() => gameState.players.find((player) => player.color === 'w'), [gameState.players]);
  const blackPlayer = useMemo(() => gameState.players.find((player) => player.color === 'b'), [gameState.players]);
  const thisPlayer = useMemo(() => gameState.players.find((player) => player.playerId === userState.id), [gameState.players])
  const color = useMemo(() => gameState.gameSettings!.color, [gameState])
  const chessManager = useMemo(() => {
    return new Chess();
  }, []);
  const pokemonManager = useMemo(() => {
    return new PokemonBattleChessManager(chessManager.board(), gameState.gameSettings.seed!, gameState.gameSettings.options.format);
  }, []);

  const [currentBattle, setCurrentBattle] = useState<CurrentBattle | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [board, setBoard] = useState(chessManager.board());
  const [currentBoard, setCurrentBoard] = useState(mergeBoardAndPokemonState(chessManager.board(), pokemonManager));
  const [isDrafting, setIsDrafting] = useState<boolean>(gameState.gameSettings.options.format === 'draft');
  const [draftTurnPick, setDraftTurnPick] = useState<Color>('w');
  const [mostRecentMove, setMostRecentMove] = useState<{ from: Square, to: Square } | null>(null);

  const { currentPokemonMoveHistory, catchingUp } = useBattleHistory({
    matchHistory,
    currentBattle,
    onBan: (draftPokemonIndex) => {
      pokemonManager.banDraftPiece(draftPokemonIndex);
      setDraftTurnPick((curr) =>  curr === 'w' ? 'b' : 'w');
    },
    onDraft: (square, draftPokemonIndex, color) => {
      handleDraftPick(square, draftPokemonIndex, color);
      setIsDrafting(!!pokemonManager.draftPieces.length);
    },
    onMove: (sanMove) => {
      return handleAttemptMove({ sanMove });
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

  /**
   * Action handlers for all the game events that change the higher level state.
   * - Pokemon battle victory/loss
   * - Moving a chess piece
   * - Banning a pokemon
   * - Drafting a pokemon 
   */
  const handleVictory = (victor: string) => {
    if (currentBattle) {
      setBattleStarted(false);
      setTimeout(() => {
        setCurrentBattle(null);
      }, 2000 * (gameState.isSkippingAhead ? 0 : 1));

      const { fromSquare, toSquare, capturedPieceSquare, promotion } = currentBattle.attemptedMove;

      // TODO: Better logic handling this
      const moveSucceeds = getVerboseChessMove(fromSquare, toSquare, chessManager)?.color === gameState.gameSettings?.color ?
        player1?.playerName === victor :
        player2?.playerName === victor;
      if (moveSucceeds) {
        pokemonManager.getPokemonFromSquare(capturedPieceSquare)!.square = null;
        chessManager.move({ from: fromSquare, to: toSquare, promotion });
        pokemonManager.movePokemonToSquare(fromSquare, toSquare, promotion);
      } else {
        const lostPiece = chessManager.get(fromSquare);
        pokemonManager.getPokemonFromSquare(fromSquare)!.square = null;
        const tempPiece = chessManager.get(capturedPieceSquare || toSquare);
        chessManager.move({ from: fromSquare, to: toSquare, promotion });
        chessManager.remove(currentBattle.attemptedMove.toSquare);
        chessManager.put(tempPiece!, capturedPieceSquare || toSquare)

        if (lostPiece?.type === 'k') {
          modalStateDispatch({ type: 'OPEN_END_GAME_MODAL', payload: { modalProps: { victor: lostPiece.color === 'w' ? 'b' : 'w' } }});
          socket.emit('setViewingResults', userState.currentRoomId, userState.id, true);
        }
      }
      setBoard(chessManager.board());
    }
  };

  const handleAttemptMove = ({ sanMove }: { sanMove: string }) => {
    let capturedPieceSquare;
    let castledRookSquare;
    let pokemonBattleInitiated = false;

    const verboseChessMove = getVerboseSanChessMove(sanMove, chessManager)!;
    const fromSquare = verboseChessMove.from;
    const toSquare = verboseChessMove.to;
    const promotion = verboseChessMove.promotion;
    if (verboseChessMove?.isEnPassant()) {
      capturedPieceSquare = `${verboseChessMove.to[0] + (parseInt(verboseChessMove.to[1]) + (verboseChessMove.color === 'w' ? -1 : 1))}` as Square;
    } else if (verboseChessMove?.isCapture()) {
      capturedPieceSquare = verboseChessMove.to;  
    }
    if (verboseChessMove?.isKingsideCastle() || verboseChessMove?.isQueensideCastle()) {
      castledRookSquare = getCastledRookSquare(verboseChessMove.color, verboseChessMove?.isKingsideCastle());
    }
    const fromCastledRookSquare = castledRookSquare?.from;
    const toCastledRookSquare = castledRookSquare?.to;

    if (pokemonManager.getPokemonFromSquare(capturedPieceSquare)) {
      setCurrentBattle({
        p1Pokemon: pokemonManager.getPlayer1PokemonFromMoveAndColor(fromSquare, capturedPieceSquare, gameState.gameSettings?.color)!,
        p2Pokemon: pokemonManager.getPlayer2PokemonFromMoveAndColor(fromSquare, capturedPieceSquare, gameState.gameSettings?.color)!,
        attemptedMove: { fromSquare, toSquare, capturedPieceSquare, promotion },
        offensivePlayer: color === chessManager.get(fromSquare)?.color ? 'p1' : 'p2',
      });

      setTimeout(() => {
        setBattleStarted(true);
      }, 2000 * (gameState.isSkippingAhead ? 0 : 1));
      pokemonBattleInitiated = true;
    } else {
      chessManager.move({ from: fromSquare, to: toSquare, promotion });
      pokemonManager.movePokemonToSquare(fromSquare, toSquare);
    }

    if (fromCastledRookSquare && toCastledRookSquare) {
      pokemonManager.movePokemonToSquare(fromCastledRookSquare, toCastledRookSquare);
    }

    if (chessManager.isCheckmate()) {
      modalStateDispatch({ type: 'OPEN_END_GAME_MODAL', payload: { modalProps: { victor: chessManager.turn() === 'w' ? 'b' : 'w' } }});
      socket.emit('setViewingResults', userState.currentRoomId, userState.id, true);
    }
    setMostRecentMove({ from: fromSquare, to: toSquare });
    setBoard(chessManager.board());
    return pokemonBattleInitiated;
  }

  const handleDraftPick = ((square: Square, draftPokemonIndex: number, draftColor: Color) => {
    const chessSquare = chessManager.get(square);
    if (chessSquare && chessSquare.color === draftColor && chessSquare.type && !pokemonManager.getPokemonFromSquare(square)) {
      pokemonManager.assignPokemonToSquare(draftPokemonIndex, square, chessSquare.type, draftColor)
      setCurrentBoard(mergeBoardAndPokemonState(currentBoard, pokemonManager));
      setDraftTurnPick((curr) =>  curr === 'w' ? 'b' : 'w');
      return true;
    }
  });

  const handleBanPick = (pkmnIndex: number) => {
    if (draftTurnPick !== color) {
      return;
    }
    pokemonManager.banDraftPiece(pkmnIndex);
    setDraftTurnPick((curr) =>  curr === 'w' ? 'b' : 'w');
  }

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
      />
      <div style={{ display: catchingUp && gameState.isSkippingAhead ? 'none' : 'block' }}>
        {
          battleStarted && currentBattle &&
          (
            <PokemonBattleManager
              p1Name={player1?.playerName!}
              p2Name={player2?.playerName!}
              p1Pokemon={currentBattle.p1Pokemon.pkmn}
              p2Pokemon={currentBattle.p2Pokemon.pkmn}
              onVictory={handleVictory}
              pokemonAdvantage={[{ side: currentBattle.offensivePlayer, boost: gameState.gameSettings.options.offenseAdvantage }]}
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
              board={board}
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
                if (draftTurnPick !== color || thisPlayer?.isSpectator) {
                  return;
                }
                if (handleDraftPick(sq, pkmnIndex, color!)) {
                  socket.emit('requestDraftPokemon', { roomId: userState.currentRoomId, playerId: userState.id, square: sq, draftPokemonIndex: pkmnIndex });
                  setIsDrafting(!!pokemonManager.draftPieces.length);
                }
              }}
              onBanPokemon={(pkmnIndex) => {
                if (thisPlayer?.isSpectator) {
                  return;
                }
                handleBanPick(pkmnIndex);
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
      />
    </div>
  )
}

export default BattleChessManager;
