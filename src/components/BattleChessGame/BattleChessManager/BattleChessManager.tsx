import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { PokemonBattleChessManager, PokemonPiece } from '../PokemonManager/PokemonBattleChessManager';
import ChessManager from '../ChessManager/ChessManager';
import PokemonBattleManager from '../PokemonManager/PokemonBattleManager/PokemonBattleManager';
import './BattleChessManager.css';
import { MoveAttempt } from '../ChessManager/types';
import { useUserState } from '../../../context/UserStateContext';

export interface CurrentBattle {
  p1Pokemon: PokemonPiece;
  p2Pokemon: PokemonPiece;
  attemptedMove: MoveAttempt;
}

function BattleChessManager() {
  const { dispatch } = useUserState();
  /**
   * TODO:
   * - Networking websocket
   * - Sync pokemon generation seeds
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
  const player1Name = 'player 1';
  const player2Name = 'player 2';
  const chessManager = useMemo(() => {
    return new Chess();
  }, []);
  const pokemonManager = useMemo(() => {
    return new PokemonBattleChessManager(chessManager.board());
  }, []);

  const [currentBattle, setCurrentBattle] = useState<CurrentBattle | null>(null);
  const handleVictory = (victor: string) => {
    if (currentBattle) {
      const { fromSquare, toSquare, promotion } = currentBattle.attemptedMove;
      if (player1Name === victor) {
        currentBattle.p2Pokemon.square = null;
        chessManager.move({ from: fromSquare, to: toSquare, promotion });
        pokemonManager.movePokemonToSquare(fromSquare, toSquare, promotion);
      } else {
        currentBattle.p1Pokemon.square = null; 
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
        p1Pokemon: pokemonManager.getPokemonFromSquare(fromSquare)!,
        p2Pokemon: pokemonManager.getPokemonFromSquare(capturedPieceSquare)!,
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
    <div className='battleChessGameContainer'>
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
