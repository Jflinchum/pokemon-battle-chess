import { useEffect, useState } from 'react';
import './RoomOptions.css';
import { FormatID, GameOptions } from '../../../../context/GameStateContext';


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

  useEffect(() => {
    onChange({
      format
    });
  }, [format]);

  return (
    <div className='roomOptionsContainer'>
      <h3>Room Options</h3>
      <div>
        <label>Format:</label>
        <select value={gameOptions.format} onChange={(e) => setFormat(e.target.value as FormatID)} name='format' disabled={!isHost}>
          {
            formatOptions.map((format) => (
              <option value={format.id} key={format.id}>{format.label}</option>
            ))
          }
        </select>
      </div>
    </div>
  );
};

export default RoomOptions;