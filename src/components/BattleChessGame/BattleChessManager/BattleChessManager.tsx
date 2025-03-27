import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { PokemonBattleChessManager, PokemonPiece } from '../PokemonManager/PokemonBattleChessManager';
import ChessManager from '../ChessManager/ChessManager';
import PokemonBattleManager from '../PokemonManager/PokemonBattleManager/PokemonBattleManager';
import { MoveAttempt } from '../ChessManager/types';
import { useUserState } from '../../../context/UserStateContext';
import { useGameState } from '../../../context/GameStateContext';
import { getVerboseChessMove } from '../ChessManager/util';

export interface CurrentBattle {
  p1Pokemon: PokemonPiece;
  p2Pokemon: PokemonPiece;
  attemptedMove: MoveAttempt;
}

function BattleChessManager() {
  const { dispatch } = useUserState();
  const { gameState } = useGameState();
  /**
   * TODO:
   * - Networking websocket
   * - Draft pokemon onto pieces
   * - Lobby UI
   * - Disable support pokemon from team generation
   * - Room Options
   *    - Preserve damage after battle
   *    - Preserve move usage after battle
   *    - Preserve item usage after battle
   *    - Draft or Randoms
   *    - Buff on chess piece attack
   *    - Weather on random chess spaces
   *    - Change pokemon on piece promotion
   */
  const player1Name = gameState.gameSettings!.player1Name;
  const player2Name = gameState.gameSettings!.player2Name;
  const chessManager = useMemo(() => {
    return new Chess();
  }, []);
  const pokemonManager = useMemo(() => {
    return new PokemonBattleChessManager(chessManager.board(), gameState.gameSettings!.seed);
  }, []);

  const [currentBattle, setCurrentBattle] = useState<CurrentBattle | null>(null);
  const handleVictory = (victor: string) => {
    if (currentBattle) {
      const { fromSquare, toSquare, promotion } = currentBattle.attemptedMove;

      // TODO: Better logic handling this
      const moveSucceeds = getVerboseChessMove(fromSquare, toSquare, chessManager)?.color === gameState.gameSettings?.color ?
        player1Name === victor :
        player2Name === victor;
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
      });
    } else {
      chessManager.move({ from: fromSquare, to: toSquare, promotion });
      pokemonManager.movePokemonToSquare(fromSquare, toSquare);
    }

    if (fromCastledRookSquare && toCastledRookSquare) {
      pokemonManager.movePokemonToSquare(fromCastledRookSquare, toCastledRookSquare);
    }
  }

  const handleLeaveRoom = () => {
    dispatch({ type: 'LEAVE_ROOM' });
  };

  return (
    <div className='battleChessContainer'>
      {
        currentBattle &&
        (<PokemonBattleManager p1Name={player1Name} p2Name={player2Name} p1Pokemon={currentBattle.p1Pokemon.pkmn} p2Pokemon={currentBattle.p2Pokemon.pkmn} onVictory={handleVictory}/>)
      }
      <div style={{ display: currentBattle ? 'none' : 'block'}}>
        <ChessManager onAttemptMove={handleAttemptMove} currentPokemonBattle={currentBattle} chessManager={chessManager} pokemonManager={pokemonManager} />
      </div>
      <button onClick={() => handleLeaveRoom()}>Leave Room</button>
    </div>
  )
}

export default BattleChessManager;
