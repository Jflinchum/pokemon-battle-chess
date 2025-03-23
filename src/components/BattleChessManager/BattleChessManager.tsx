import { useMemo, useEffect } from 'react';
import { Chess } from 'chess.js';
import { PokemonBattleChessManager } from '../PokemonBattleManager/PokemonBattleChessManager';
import ChessManager from '../Chess/ChessManager';
import PokemonBattleDisplay from '../PokemonBattleManager/PokemonBattleDisplay/PokemonBattleDisplay'

function BattleChessManager() {
  const chessManager = useMemo(() => {
    return new Chess();
  }, []);
  const pokemonManager = useMemo(() => {
    return new PokemonBattleChessManager(chessManager.board());
  }, []);

  return (
    <div>
      <ChessManager chessManager={chessManager} pokemonManager={pokemonManager}/>
      {
        pokemonManager.getCurrentBattle().onGoing &&
        (<PokemonBattleDisplay player1Pokemon={pokemonManager.getCurrentBattle().player1Pokemon!} player2Pokemon={pokemonManager.getCurrentBattle().player2Pokemon!}/>)
      }
    </div>
  )
}

export default BattleChessManager;
