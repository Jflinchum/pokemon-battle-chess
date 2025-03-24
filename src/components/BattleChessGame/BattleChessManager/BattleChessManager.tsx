import { useMemo, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { PokemonBattleChessManager, PokemonPiece } from '../PokemonManager/PokemonBattleChessManager';
import ChessManager from '../ChessManager/ChessManager';
import PokemonBattleManager from '../PokemonManager/PokemonBattleManager/PokemonBattleManager';
import './BattleChessManager.css';

export interface CurrentBattle {
  p1Pokemon: PokemonPiece;
  p2Pokemon: PokemonPiece;
  attemptedMove: {
    toSquare: Square;
    fromSquare: Square
  }
}

function BattleChessManager() {
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
      const { fromSquare, toSquare } = currentBattle.attemptedMove;
      if (player1Name === victor) {
        currentBattle.p2Pokemon.square = null;
        chessManager.move({ from: fromSquare, to: toSquare });
        pokemonManager.movePokemonToSquare(fromSquare, toSquare);
      } else {
        currentBattle.p1Pokemon.square = null; 
        const tempPiece = chessManager.get(toSquare);
        chessManager.move({ from: fromSquare, to: toSquare });
        chessManager.remove(currentBattle.attemptedMove.fromSquare);
        chessManager.put(tempPiece!, toSquare)
      }
      setCurrentBattle(null);
    }
  };


  return (
    <div className='battleChessGameContainer'>
      {
        currentBattle &&
        (<PokemonBattleManager p1Name={player1Name} p2Name={player2Name} p1Pokemon={currentBattle.p1Pokemon.pkmn} p2Pokemon={currentBattle.p2Pokemon.pkmn} onVictory={handleVictory}/>)
      }
      <div style={{ display: currentBattle ? 'none' : 'block'}}>
        <ChessManager currentPokemonBattle={currentBattle} chessManager={chessManager} pokemonManager={pokemonManager} onStartBattle={(p1Pokemon, p2Pokemon, attemptedMove) => { setCurrentBattle({ p1Pokemon, p2Pokemon, attemptedMove }) }}/>
      </div>
    </div>
  )
}

export default BattleChessManager;
