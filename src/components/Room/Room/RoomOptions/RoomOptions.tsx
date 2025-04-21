import { useEffect, useState } from 'react';
import './RoomOptions.css';
import { FormatID, GameOptions } from '../../../../context/GameStateContext';
import { BoostID, BoostsTable } from '@pkmn/data';

const advantageOptions: { stat: BoostID, label: string }[] = [
  { stat: 'atk', label: 'Attack' },
  { stat: 'spa', label: 'Special Attack' },
  { stat: 'def', label: 'Defense' },
  { stat: 'spd', label: 'Special Defense' },
  { stat: 'spe', label: 'Speed' },
  { stat: 'accuracy', label: 'Accuracy' },
  { stat: 'evasion', label: 'Evasion' },
];

const formatOptions: { id: FormatID, label: string}[] = [
  { id: 'random', label: 'Random' },
  { id: 'draft', label: 'Draft' },
];

interface RoomOptionsProp {
  isHost?: boolean;
  gameOptions: GameOptions,
  onChange: (arg: GameOptions) => void
}

const RoomOptions = ({ isHost, gameOptions, onChange }: RoomOptionsProp) => {
  const [format, setFormat] = useState<FormatID>(gameOptions.format);
  const [offenseAdvantage, setOffenseAdvantage] = useState<BoostsTable>(gameOptions.offenseAdvantage);
  const [timersEnabled, setTimersEnabled] = useState<boolean>(gameOptions.timersEnabled);
  const [banTimer, setBanTimer] = useState<number>(gameOptions.banTimerDuration);
  const [chessTimer, setChessTimer] = useState<number>(gameOptions.chessTimerDuration);
  const [chessIncrement, setChessIncrement] = useState<number>(gameOptions.chessTimerIncrement);
  const [pokemonIncrement, setPokemonIncrement] = useState<number>(gameOptions.pokemonTimerIncrement);

  useEffect(() => {
    onChange({
      format,
      offenseAdvantage,
      timersEnabled,
      chessTimerDuration: chessTimer,
      banTimerDuration: banTimer,
      chessTimerIncrement: chessIncrement,
      pokemonTimerIncrement: pokemonIncrement,
    });
  }, [format, offenseAdvantage, timersEnabled, chessTimer, banTimer, chessIncrement, pokemonIncrement]);

  return (
    <div className='roomOptionsContainer'>
      <h3>Room Options</h3>
      <ul className='roomOptionsList'>
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label htmlFor='format'>Format:</label>
            <p>
              Random will randomly assign a Pokemon to each chess piece and then start the match.
            </p>
            <p>
              Draft will give players a shared pool of Pokemon to choose from.
              After taking turns banning from the pool, players can then assign Pokemon to their piece of choice.
            </p>
          </div>
          <select value={gameOptions.format} onChange={(e) => setFormat(e.target.value as FormatID)} name='format' disabled={!isHost}>
            {
              formatOptions.map((format) => (
                <option value={format.id} key={format.id}>{format.label}</option>
              ))
            }
          </select>
        </li>
        <hr></hr>
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label htmlFor='gameTimer'>Game timers:</label>
            <p>
              Timer countdowns in game. If players run out of time during the draft/ban phase, a random pokemon will be chosen and
              randomly assigned. If players run out of time in chess/pokemon, then they will lose.
            </p>
            <p>
              Increment times give the player that amount of time whenever they perform their turn.
            </p>
          </div>
          <input checked={gameOptions.timersEnabled} type='checkbox' onChange={() => setTimersEnabled(!gameOptions.timersEnabled)} name='gameTimer' disabled={!isHost}/>
        </li>
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label htmlFor='banTimer'>Ban Timer:</label>
            <p>
              Amount of time (in seconds) that the player has to ban a pokemon.
            </p>
          </div>
          <input value={gameOptions.banTimerDuration} type='input' onChange={(e) => setBanTimer(parseInt(e.target.value))} name='banTimer' disabled={!isHost}/>
        </li>
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label htmlFor='chessTimer'>Chess Timer:</label>
            <p>
              Amount of time (in minutes) that the player has in the chess game.
            </p>
          </div>
          <input value={gameOptions.chessTimerDuration} type='input' onChange={(e) => setChessTimer(parseInt(e.target.value))} name='chessTimer' disabled={!isHost}/>
        </li>
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label htmlFor='chessIncrement'>Chess Increment:</label>
            <p>
              Amount of time (in seconds) that the player gains in the chess game every time they move a piece.
            </p>
          </div>
          <input value={gameOptions.chessTimerIncrement} type='input' onChange={(e) => setChessIncrement(parseInt(e.target.value))} name='chessIncrement' disabled={!isHost}/>
        </li>
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label htmlFor='pokemonIncrement'>Pokemon Increment:</label>
            <p>
              Amount of time (in seconds) that the player gains in the chess game every time they select a move in a pokemon battle.
            </p>
          </div>
          <input value={gameOptions.pokemonTimerIncrement} type='input' onChange={(e) => setPokemonIncrement(parseInt(e.target.value))} name='pokemonIncrement' disabled={!isHost}/>
        </li>
        <hr></hr>
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label>Offense Advantage:</label>
            <p>
              If a chess piece attacks another, this will decide what buffs they get at the start of the match.
            </p>
          </div>
          <ul>
            {advantageOptions.map((adv) => (
              <li key={adv.stat}>
                <select name={adv.stat} disabled={!isHost} value={gameOptions.offenseAdvantage[adv.stat]} onChange={(e) => setOffenseAdvantage({ ...offenseAdvantage, [adv.stat]: parseInt(e.target.value) })}>
                  {
                    Array.from({ length: 7 }).map((_, index) => (
                      <option value={index} key={index}>+{index}</option>
                    ))
                  }
                </select>
                <label htmlFor={adv.stat}>{adv.label}</label>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default RoomOptions;