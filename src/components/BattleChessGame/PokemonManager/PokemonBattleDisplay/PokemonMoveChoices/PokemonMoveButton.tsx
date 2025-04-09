import { Dex } from "@pkmn/dex";
import { Move } from "@pkmn/data";
import Button from "../../../../common/PokemonMoveButton/PokemonMoveButton";
import './PokemonMoveChoices.css';

interface PokemonMoveButtonProps {
  move: string;
  disabled?: boolean;
  pp?: number;
  maxpp?: number;
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

const PokemonMoveButton = ({ move, pp, maxpp, disabled, onMoveSelect = () => {} }: PokemonMoveButtonProps) => {
  const dexMoveInfo = Dex.moves.get(move);

  return (
    <Button className={'pokemonMoveButton'} disabled={disabled} colorPrimary={getMoveButtonColor(dexMoveInfo.type)} onClick={() => { onMoveSelect(move) }} toolTip={PokemonMoveTooltip({ move })}>
      <p className='pokemonMoveName'>{dexMoveInfo.name}</p>

      <div className='pokemonMoveSubInfo'>
        {
          dexMoveInfo.type && (
            <span className='pokemonMoveTyping'>
              {dexMoveInfo.type}
            </span>
          )
        }

        {
          pp && maxpp && (
            <span className='pokemonMovePP'>
              {pp}/{maxpp}
            </span>
          )
        }
      </div>
    </Button>
  )
}

const PokemonMoveTooltip = ({ move }: { move: string }) => {
  const dexMoveInfo = Dex.moves.get(move);
  return (
    <div>
      <div>
        <strong>{dexMoveInfo.name}</strong>
        <p>{dexMoveInfo.type} - {dexMoveInfo.category}</p>
      </div>
      <hr/>
      <div>
        {
          dexMoveInfo.basePower ? (
            <p>Base power: {dexMoveInfo.basePower}</p>
          ) : null
        }
        {
          typeof dexMoveInfo.accuracy === 'number' && (
            <p>Accuracy: {dexMoveInfo.accuracy}</p>
          )
        }
        {
          dexMoveInfo.basePower || typeof dexMoveInfo.accuracy === 'number' ?
          (<hr/>) :
          (null)
        }
      </div>
      <div>
        {dexMoveInfo.shortDesc}
      </div>
    </div>
  );
}

export default PokemonMoveButton;
