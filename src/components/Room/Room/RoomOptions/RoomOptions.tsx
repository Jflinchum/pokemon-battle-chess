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

  useEffect(() => {
    onChange({
      format,
      offenseAdvantage,
    });
  }, [format, offenseAdvantage]);

  return (
    <div className='roomOptionsContainer'>
      <h3>Room Options</h3>
      <ul className='roomOptionsList'>
        <li className='roomOption'>
          <div className='roomOptionLabel'>
            <label htmlFor='format'>Format:</label>
            <p>
              Random will randomly assign a pokemon to each chess piece and then start the match.
            </p>
            <p>
              Draft will give players the option to draft pokemon from a pool to each chess piece. 
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