import { Dex } from "@pkmn/dex";
import './PokemonMoveChoices.css';
import { Move } from "@pkmn/data";

interface PokemonMoveButtonProps {
  move: string;
  onMoveSelect?: (move: string) => void;
}

const getMoveButtonColor = (moveType: Move['type']) => {
  switch (moveType) {
    case 'Normal': return '#aca596';
    case 'Water': return '#508dd6';
    case 'Grass': return '#8fcb63';
    case 'Fire': return '#e55e3f';
    case 'Electric': return '#f7c753';
    case 'Rock': return '#b8a038';
    case 'Flying': return '#9eaef1';
    case 'Poison': return '#a960a1';
    case 'Bug': return '#b0bb44';
    case 'Psychic': return '#f85888';
    case 'Dark': return '#705848';
    case 'Ground': return '#d1b568';
    case 'Ice': return '#a1d8d5';
    case 'Dragon': return '#7668df';
    case 'Ghost': return '#705898';
    case 'Steel': return '#adadc4';
    case 'Fighting': return '#903028';
    case 'Fairy': return '#e58fe1';
    default: return '#d8d5de';
  }
}

const PokemonMoveButton = ({ move, onMoveSelect = () => {} }: PokemonMoveButtonProps) => {
  const dexMoveInfo = Dex.moves.get(move);

  return (
    <button
      style={{ border: `${getMoveButtonColor(dexMoveInfo.type)} solid 3px`, background: `linear-gradient(0deg, ${getMoveButtonColor(dexMoveInfo.type)} 0%, white 100%)` }}
      className='moveButton'
      onClick={() => {onMoveSelect(move)}}
    >
      {dexMoveInfo.name}
      <div className='moveTooltip'>
        <div>
          <strong>{dexMoveInfo.name}</strong>
          <p>{dexMoveInfo.type} - {dexMoveInfo.category}</p>
        </div>
        <hr/>
        {
          dexMoveInfo.basePower && dexMoveInfo.accuracy ? (
            <div>
              <p>Base power: {dexMoveInfo.basePower}</p>
              <p>Accuracy: {dexMoveInfo.accuracy}</p>
              <hr/>
            </div>
          ) : null
        }
        <div>
          {dexMoveInfo.shortDesc}
        </div>
      </div>
    </button>
  )
}

export default PokemonMoveButton;
