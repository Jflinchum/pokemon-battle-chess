import { useEffect, useMemo, useState } from 'react';
import { Chess, Color, Square } from 'chess.js';
import { PokemonBattleChessManager, PokemonPiece } from '../PokemonManager/PokemonBattleChessManager';
import ChessManager from '../ChessManager/ChessManager';
import PokemonBattleManager from '../PokemonManager/PokemonBattleManager/PokemonBattleManager';
import DraftPokemonManager from '../DraftPokemonManager/DraftPokemonManager';
import { MoveAttempt } from '../ChessManager/types';
import { useUserState } from '../../../context/UserStateContext';
import { useGameState } from '../../../context/GameStateContext';
import { getVerboseChessMove, mergeBoardAndPokemonState } from '../ChessManager/util';
import { useModalState } from '../../../context/ModalStateContext';
import { socket } from '../../../socket';
import './BattleChessManager.css';
import PlayerInGameDisplay from './PlayerInGameDisplay/PlayerInGameDisplay';
import { SideID } from '@pkmn/data';

export interface CurrentBattle {
  p1Pokemon: PokemonPiece;
  p2Pokemon: PokemonPiece;
  attemptedMove: MoveAttempt;
  offensivePlayer: SideID;
}

function BattleChessManager() {
  const { userState, dispatch } = useUserState();
  const { dispatch: modalStateDispatch } = useModalState();
  const { gameState } = useGameState();
  /**
   * TODO:
   * - Disable support pokemon from team generation
   * - Room Options
   *    - Preserve damage after battle
   *    - Preserve move usage after battle
   *    - Preserve item usage after battle
   *    - Custom Teams
   *    - Buff on chess piece attack
   *    - Weather on random chess spaces
   *    - Change pokemon on piece promotion
   */
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
  const [currentBoard, setCurrentBoard] = useState(mergeBoardAndPokemonState(chessManager.board(), pokemonManager));
  const [isDrafting, setIsDrafting] = useState<boolean>(gameState.gameSettings.options.format === 'draft');
  const [draftTurnPick, setDraftTurnPick] = useState<Color>('w');
  const [mostRecentMove, setMostRecentMove] = useState<{ from: Square, to: Square } | null>(null);

  useEffect(() => {
    socket.on('startPokemonDraft', ({ square, draftPokemonIndex, socketColor }) => {
      handleDraftPick(square, draftPokemonIndex, socketColor);
      setIsDrafting(!!pokemonManager.whiteDraftPieces.length || !!pokemonManager.blackDraftPieces.length)
    });

    return () => {
      socket.off('startPokemonDraft');
    };
  }, [draftTurnPick]);

  const handleVictory = (victor: string) => {
    if (currentBattle) {
      const { fromSquare, toSquare, promotion } = currentBattle.attemptedMove;

      // TODO: Better logic handling this
      const moveSucceeds = getVerboseChessMove(fromSquare, toSquare, chessManager)?.color === gameState.gameSettings?.color ?
        player1?.playerName === victor :
        player2?.playerName === victor;
      if (moveSucceeds) {
        pokemonManager.getPokemonFromSquare(toSquare)!.square = null;
        chessManager.move({ from: fromSquare, to: toSquare, promotion });
        pokemonManager.movePokemonToSquare(fromSquare, toSquare, promotion);
      } else {
        pokemonManager.getPokemonFromSquare(fromSquare)!.square = null;
        const tempPiece = chessManager.get(toSquare);
        chessManager.move({ from: fromSquare, to: toSquare, promotion });
        chessManager.remove(currentBattle.attemptedMove.fromSquare);
        chessManager.put(tempPiece!, toSquare)
      }
      setCurrentBattle(null);
    }
  };

  const handleAttemptMove = ({ fromSquare, toSquare, capturedPieceSquare, promotion, fromCastledRookSquare, toCastledRookSquare }: MoveAttempt) => {
    if (pokemonManager.getPokemonFromSquare(capturedPieceSquare)) {
      setCurrentBattle({
        p1Pokemon: pokemonManager.getPlayer1PokemonFromMoveAndColor(fromSquare, toSquare, gameState.gameSettings?.color)!,
        p2Pokemon: pokemonManager.getPlayer2PokemonFromMoveAndColor(fromSquare, toSquare, gameState.gameSettings?.color)!,
        attemptedMove: { fromSquare, toSquare, capturedPieceSquare, promotion },
        offensivePlayer: color === chessManager.get(fromSquare)?.color ? 'p1' : 'p2',
      });
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
  }

  const handleLeaveRoom = () => {
    dispatch({ type: 'LEAVE_ROOM' });
  };

  const handleDraftPick = ((square: Square, draftPokemonIndex: number, draftColor: Color) => {
    const chessSquare = chessManager.get(square);
    if (chessSquare && chessSquare.color === draftColor && chessSquare.type && !pokemonManager.getPokemonFromSquare(square)) {
      pokemonManager.assignPokemonToSquare(draftPokemonIndex, square, chessSquare.type, draftColor)
      setCurrentBoard(mergeBoardAndPokemonState(currentBoard, pokemonManager));
      setDraftTurnPick((curr) =>  curr === 'w' ? 'b' : 'w');
      return true;
    }
  });

  return (
    <div className='battleChessContainer'>
      <p>Turn: {chessManager.moveNumber()}</p>
      <PlayerInGameDisplay player={color === 'w' ? blackPlayer : whitePlayer}/>
      {
        currentBattle &&
        (
          <PokemonBattleManager
            p1Name={player1?.playerName!}
            p2Name={player2?.playerName!}
            p1Pokemon={currentBattle.p1Pokemon.pkmn}
            p2Pokemon={currentBattle.p2Pokemon.pkmn}
            onVictory={handleVictory}
            pokemonAdvantage={[{ side: currentBattle.offensivePlayer, boost: gameState.gameSettings.options.offenseAdvantage }]}
          />
        )
      }
      {
        !currentBattle && !isDrafting &&
        (
          <ChessManager onAttemptMove={handleAttemptMove} chessManager={chessManager} pokemonManager={pokemonManager} mostRecentMove={mostRecentMove}/>
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
                setIsDrafting(!!pokemonManager.whiteDraftPieces.length || !!pokemonManager.blackDraftPieces.length)
              }
            }}
          />
        )
      }
      <PlayerInGameDisplay player={color === 'w' ? whitePlayer : blackPlayer}/>
      <div className='gameManagerBottomActions'>
        <button onClick={() => handleLeaveRoom()}>Forfeit and return to menu</button>
      </div>
    </div>
  )
}

export default BattleChessManager;
