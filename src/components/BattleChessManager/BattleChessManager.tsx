import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { PokemonBattleChessManager } from '../PokemonManager/PokemonBattleChessManager';
import ChessManager from '../ChessManager/ChessManager';
import PokemonBattleManager from '../PokemonManager/PokemonBattleManager/PokemonBattleManager';
import { PokemonSet } from '@pkmn/data';
import './BattleChessManager.css';

function BattleChessManager() {
  const chessManager = useMemo(() => {
    return new Chess();
  }, []);
  const pokemonManager = useMemo(() => {
    return new PokemonBattleChessManager(chessManager.board());
  }, []);
  const [currentBattle, setCurrentBattle] = useState<{ p1Pokemon: PokemonSet, p2Pokemon: PokemonSet } | null>(null);


  return (
    <div className='battleChessRoot'>
      <ChessManager chessManager={chessManager} pokemonManager={pokemonManager} onStartBattle={(p1Pokemon, p2Pokemon) => { setCurrentBattle({ p1Pokemon, p2Pokemon }) }}/>
      {
        currentBattle &&
        (<PokemonBattleManager p1Pokemon={currentBattle.p1Pokemon} p2Pokemon={currentBattle.p2Pokemon}/>)
      }
    </div>
  )
}

export default BattleChessManager;
