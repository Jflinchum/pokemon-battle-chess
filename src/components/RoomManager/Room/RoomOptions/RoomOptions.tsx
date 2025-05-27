import { useEffect, useMemo, useState } from 'react';
import { BoostID, BoostsTable } from '@pkmn/data';
import { FormatID } from '../../../../context/GameStateContext';
import { GameOptions } from '../../../../../shared/types/GameOptions';
import  { GameTimerOptions, TimerId, getTimerIdFromTimerData, timerIdToTimerMapping } from './GameTimerOptions/GameTimerOptions';
import './RoomOptions.css';


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
  const [weatherWars, setWeatherWars] = useState<boolean>(gameOptions.weatherWars);
  const [banTimer, setBanTimer] = useState<number>(gameOptions.banTimerDuration);
  const currentTimerId = useMemo(() => getTimerIdFromTimerData({
    chess: gameOptions.chessTimerDuration,
    chessInc: gameOptions.chessTimerIncrement,
    pkmnInc: gameOptions.pokemonTimerIncrement
  }), [gameOptions.chessTimerDuration, gameOptions.chessTimerIncrement, gameOptions.pokemonTimerIncrement]);
  const [timerId, setTimerId] = useState<TimerId>(currentTimerId);

  useEffect(() => {
    onChange({
      format,
      offenseAdvantage,
      weatherWars,
      timersEnabled: timerId !== 'No Timer',
      banTimerDuration: banTimer,
      chessTimerDuration: timerIdToTimerMapping[timerId].chess,
      chessTimerIncrement: timerIdToTimerMapping[timerId].chessInc,
      pokemonTimerIncrement: timerIdToTimerMapping[timerId].pkmnInc,
    });
  }, [format, offenseAdvantage, weatherWars, banTimer, timerId]);

  return (
    <div className='roomOptionsContainer'>
      <h3>Room Options</h3>
      <ul className='roomOptionsList'>
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label htmlFor='format'>Pokemon Assignments:</label>
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
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label htmlFor='format'>Weather Wars:</label>
            <p>
              Enabling this mode will create different weather and terrain effects on random chess squares.
              These weather and terrain effects will come and go throughout the match.
            </p>
          </div>
          <input checked={gameOptions.weatherWars} type='checkbox' onChange={(e) => setWeatherWars(e.target.checked)} />
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
            {advantageOptions.filter(({ stat }) => stat !== 'accuracy' && stat !== 'evasion').map((adv) => (
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
        <hr></hr>
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label htmlFor='gameTimer'>Game Timer:</label>
            <p>
              Timer countdowns in game. If players run out of time during the draft/ban phase, a random pokemon will be chosen and
              randomly assigned. If players run out of time in chess/pokemon, then they will lose.
            </p>
            <p>
              Time controls are in an "X + Y + Z" format. The first number is the amount of total minutes in the match. The second number is
              the amount of seconds a player gets when they move a chess piece. The final third number is the amount of seconds a player gets
              when they make a decision in a pokemon battle.
            </p>
          </div>
          <GameTimerOptions timerId={currentTimerId} onChange={setTimerId} disabled={!isHost}/>
        </li>
        {
          gameOptions.format === 'draft' && currentTimerId !== 'No Timer' && (
            <li className='roomOption'>
              <div className='roomOptionLabel'>
                <label htmlFor='banTimer'>Draft/Ban Timer:</label>
                <p>
                  Amount of time (in seconds) that the player has to ban and draft a pokemon.
                </p>
              </div>
              <select className='roomOptionBanTimer' name='banTimerDuration' value={gameOptions.banTimerDuration} onChange={(e) => setBanTimer(parseInt(e.target.value))} disabled={!isHost}>
                <option value={1}>1 second</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={45}>45 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </li>
          )
        }
      </ul>
    </div>
  );
};

export default RoomOptions;