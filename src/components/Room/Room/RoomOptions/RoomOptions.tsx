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
      <ul>
        <li>
          <label>Format:</label>
          <select value={gameOptions.format} onChange={(e) => setFormat(e.target.value as FormatID)} name='format' disabled={!isHost}>
            {
              formatOptions.map((format) => (
                <option value={format.id} key={format.id}>{format.label}</option>
              ))
            }
          </select>
        </li>
        <li>
          <label>Offense Advantage:</label>
          <ul>
            {advantageOptions.map((adv) => (
              <li key={adv.stat}>
                <label>{adv.label}</label>
                <select disabled={!isHost} value={gameOptions.offenseAdvantage[adv.stat]} onChange={(e) => setOffenseAdvantage({ ...offenseAdvantage, [adv.stat]: parseInt(e.target.value) })}>
                  {
                    Array.from({ length: 7 }).map((_, index) => (
                      <option value={index} key={index}>+{index}</option>
                    ))
                  }
                </select>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default RoomOptions;