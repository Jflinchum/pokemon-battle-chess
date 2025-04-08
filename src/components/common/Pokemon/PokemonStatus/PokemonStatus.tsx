import { StatusName } from "@pkmn/data"
import burnStatus from '../../../../assets/pokemonAssets/status/burnStatus.png'
import frozenStatus from '../../../../assets/pokemonAssets/status/frozenStatus.png'
import paralyzeStatus from '../../../../assets/pokemonAssets/status/paralyzeStatus.png'
import poisonStatus from '../../../../assets/pokemonAssets/status/poisonStatus.png'
import sleepStatus from '../../../../assets/pokemonAssets/status/sleepStatus.png'
import toxicStatus from '../../../../assets/pokemonAssets/status/toxicStatus.png'
import './PokemonStatus.css';

const getStatusSymbol = (status: StatusName) => {
  switch (status) {
    case 'brn':
      return burnStatus; 
    case 'frz':
      return frozenStatus; 
    case 'par':
      return paralyzeStatus; 
    case 'psn':
      return poisonStatus; 
    case 'slp':
      return sleepStatus; 
    case 'tox':
      return toxicStatus; 
    default:
      return burnStatus;
  }
};

const statusToLabelMapping: Record<StatusName, string> = {
  'brn': 'Burn',
  'frz': 'Frozen',
  'par': 'Paralyze',
  'psn': 'Poison',
  'slp': 'Sleep',
  'tox': 'Toxic',
}

const PokemonStatus = ({ status }: { status?: StatusName }) => {
  if (!status) {
    return null;
  }

  return (
    <img aria-label={statusToLabelMapping[status]} className='status' src={getStatusSymbol(status)}/>
  )
}

export default PokemonStatus;