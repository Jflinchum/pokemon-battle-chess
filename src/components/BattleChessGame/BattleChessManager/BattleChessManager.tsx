import { useEffect, useMemo, useRef, useState } from 'react';
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
import { timer } from '../../../utils';

export interface CurrentBattle {
  p1Pokemon: PokemonPiece;
  p2Pokemon: PokemonPiece;
  attemptedMove: MoveAttempt;
  offensivePlayer: SideID;
}

function BattleChessManager({ matchHistory }: { matchHistory?: MatchHistory }) {
  const { userState } = useUserState();
  const { dispatch: modalStateDispatch } = useModalState();
  const { gameState } = useGameState();

  const player1 = useMemo(() => gameState.players.find((player) => player.isPlayer1), [gameState.players]);
  const player2 = useMemo(() => gameState.players.find((player) => player.isPlayer2), [gameState.players]);
  const whitePlayer = useMemo(() => gameState.players.find((player) => player.color === 'w'), [gameState.players]);
  const blackPlayer = useMemo(() => gameState.players.find((player) => player.color === 'b'), [gameState.players]);
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
  const isCatchingUp = useRef(!!matchHistory);
  const banHistoryRef = useRef(matchHistory?.banHistory || []);
  const banHistoryIndex = useRef(0);
  const draftHistoryRef = useRef(matchHistory?.pokemonAssignments || []);
  const draftHistoryIndex = useRef(0);
  const chessMoveHistoryRef = useRef(matchHistory?.chessMoveHistory || []);
  const chessMoveHistoryIndex = useRef(0);
  const pokemonBattleHistoryRef = useRef(matchHistory?.pokemonBattleHistory || []);
  const pokemonBattleHistoryIndex = useRef(0);
  const [currentPokemonMoveHistory, setCurrentPokemonMoveHistory] = useState<string[]>([]);
  const [catchUpAnimationTimer, setCatchUpAnimationTimer] = useState(whitePlayer?.playerId === userState.id || blackPlayer?.playerId === userState.id ? 0 : 1);


  useEffect(() => {
    socket.on('startPokemonDraft', ({ square, draftPokemonIndex, socketColor, isBan }) => {
      if (isBan) {
        banHistoryRef.current.push(draftPokemonIndex);
        if (!isCatchingUp.current) {
          banHistoryIndex.current++;
          pokemonManager.banDraftPiece(draftPokemonIndex);
          setDraftTurnPick((curr) =>  curr === 'w' ? 'b' : 'w');
        }
      } else {
        draftHistoryRef.current.push(`${socketColor} ${draftPokemonIndex} ${square}`)
        if (!isCatchingUp.current) {
          draftHistoryIndex.current++;
          handleDraftPick(square, draftPokemonIndex, socketColor);
          setIsDrafting(!!pokemonManager.draftPieces.length);
        }
      }
    });

    socket.on('startPokemonMove', ({ move }) => {
      pokemonBattleHistoryRef.current[pokemonBattleHistoryRef.current.length - 1].push(move);
      console.log('TEST');
      console.log(move);
      console.log(pokemonBattleHistoryIndex.current)
      console.log(pokemonBattleHistoryRef.current)
      if (pokemonBattleHistoryIndex.current === pokemonBattleHistoryRef.current.length) {
        setCurrentPokemonMoveHistory((curr) => [...curr, move]);
      }
    });

    socket.on('startChessMove', ({ sanMove }) => {
      chessMoveHistoryRef.current.push(sanMove);
      if (sanMove.includes('x')) {
        pokemonBattleHistoryRef.current.push([]);
      }
      if (!isCatchingUp.current) {
        chessMoveHistoryIndex.current++;
        handleAttemptMove({ sanMove });
      }
    });

    return () => {
      socket.off('startChessMove');
      socket.off('startPokemonDraft');
      socket.off('startPokemonMove');
    };
  }, []);

  useEffect(() => {
    let catchUpTimer: { start: () => Promise<void>, stop: () => void } | undefined;
    // On mount, start attempting to sync to the current match
    const catchUpToCurrentState = async () => {
      // Ban phase catchup
      for (; banHistoryIndex.current < banHistoryRef.current.length; banHistoryIndex.current++) {
        catchUpTimer = timer(1000 * catchUpAnimationTimer);
        await catchUpTimer.start();
        const banPiece = banHistoryRef.current[banHistoryIndex.current]!;
        pokemonManager.banDraftPiece(banPiece);
        setDraftTurnPick((curr) =>  curr === 'w' ? 'b' : 'w');
      }
      // Draft phase catchup
      for (; draftHistoryIndex.current < draftHistoryRef.current.length; draftHistoryIndex.current++) {
        const isRandomDraft = gameState.gameSettings.options.format === 'random' ? 0 : 1;
        catchUpTimer = timer(1000 * isRandomDraft * catchUpAnimationTimer);
        await catchUpTimer.start();
        const draft = draftHistoryRef.current[draftHistoryIndex.current]!;
        // Instant draft on random
        const draftArgs = draft.split(' ');
        const color = draftArgs[0] as Color;
        const index = parseInt(draftArgs[1]);
        const square = draftArgs[2] as Square;
        handleDraftPick(square, index, color);
        setIsDrafting(!!pokemonManager.draftPieces.length);
      }

      for (; chessMoveHistoryIndex.current < chessMoveHistoryRef.current.length; chessMoveHistoryIndex.current++) {
        catchUpTimer = timer(1000 * catchUpAnimationTimer);

        await catchUpTimer.start();
        const sanMove = chessMoveHistoryRef.current[chessMoveHistoryIndex.current]!;
        if (handleAttemptMove({ sanMove })) {
          // If handle attempt move detects a pokemon battle, wait until the battle is resolved
          chessMoveHistoryIndex.current++;
          return;
        }
      }

      isCatchingUp.current = false;
    }
  
    if (isCatchingUp.current && !currentBattle) {
      catchUpToCurrentState();
    }

    return () => {
      catchUpTimer?.stop();
    }
  }, [currentBattle]);

  const handleVictory = (victor: string) => {
    if (currentBattle) {
      setBattleStarted(false);
      setTimeout(() => {
        setCurrentBattle(null);
      }, 2000 * (isCatchingUp.current ? catchUpAnimationTimer : 1));

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
      console.log(pokemonBattleHistoryIndex.current);
      console.log(pokemonBattleHistoryRef.current);
      setCurrentPokemonMoveHistory(pokemonBattleHistoryIndex.current !== pokemonBattleHistoryRef.current.length ? pokemonBattleHistoryRef.current[pokemonBattleHistoryIndex.current] : []);
      pokemonBattleHistoryIndex.current++;
      setCurrentBattle({
        p1Pokemon: pokemonManager.getPlayer1PokemonFromMoveAndColor(fromSquare, capturedPieceSquare, gameState.gameSettings?.color)!,
        p2Pokemon: pokemonManager.getPlayer2PokemonFromMoveAndColor(fromSquare, capturedPieceSquare, gameState.gameSettings?.color)!,
        attemptedMove: { fromSquare, toSquare, capturedPieceSquare, promotion },
        offensivePlayer: color === chessManager.get(fromSquare)?.color ? 'p1' : 'p2',
      });

      setTimeout(() => {
        setBattleStarted(true);
      }, 2000 * (isCatchingUp.current  ? catchUpAnimationTimer : 1));
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

  return (
    <div className='battleChessContainer'>
      <p>Turn: {chessManager.moveNumber()}</p>
      <PlayerInGameDisplay player={color === 'w' ? blackPlayer : whitePlayer}/>
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
            catchUpAnimationTimer={isCatchingUp.current ? catchUpAnimationTimer : 1}
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
              if (draftTurnPick !== color) {
                return;
              }
              if (handleDraftPick(sq, pkmnIndex, color!)) {
                socket.emit('requestDraftPokemon', { roomId: userState.currentRoomId, playerId: userState.id, square: sq, draftPokemonIndex: pkmnIndex });
                setIsDrafting(!!pokemonManager.draftPieces.length);
              }
            }}
            onBanPokemon={(pkmnIndex) => {
              handleBanPick(pkmnIndex);
              socket.emit('requestDraftPokemon', { roomId: userState.currentRoomId, playerId: userState.id, draftPokemonIndex: pkmnIndex, isBan: true });
            }}
          />
        )
      }
      <PlayerInGameDisplay player={color === 'w' ? whitePlayer : blackPlayer}/>
    </div>
  )
}

export default BattleChessManager;
