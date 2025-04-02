import { Pokemon } from "@pkmn/client";
import { Sprites } from "@pkmn/img";
import { BoostID, GenderName, StatusName } from "@pkmn/data";
import burnStatus from '../../../../../../assets/pokemonAssets/burnStatus.png'
import frozenStatus from '../../../../../../assets/pokemonAssets/frozenStatus.png'
import paralyzeStatus from '../../../../../../assets/pokemonAssets/paralyzeStatus.png'
import poisonStatus from '../../../../../../assets/pokemonAssets/poisonStatus.png'
import sleepStatus from '../../../../../../assets/pokemonAssets/sleepStatus.png'
import toxicStatus from '../../../../../../assets/pokemonAssets/toxicStatus.png'
import ProgressBar from "../../../../../common/ProgressBar/ProgressBar";
import './PokemonFieldSprite.css';

interface PokemonFieldSpriteProps {
  pokemon: Pokemon,
  side: 'p1' | 'p2',
}

const getHealthBarColor = (maxHp: number, currentHp: number) => {
  const percentage = (currentHp/maxHp) * 100;
  if (percentage > 50) {
    return 'green';
  } else if (percentage > 20) {
    return 'yellow';
  } else {
    return 'red';
  }
}

const getGenderSymbol = (gender: GenderName) => {
  switch (gender) {
    case ('M'): return '♂️';
    case ('F'): return '♀️';
    case ('N'): return '';
  }
}

const getStatusSymbol = (status?: StatusName) => {
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

const mapBoostStageToMultiplier = (stage?: number) => {
  if (!stage) {
    return 1; 
  } else if (stage > 0) {
    return `${(stage + 2) / 2}`.slice(0, 4);
  } else {
    return `${2 / (2 - stage)}`.slice(0, 4);
  }
};

const boostToLabel: Record<BoostID, string> = {
  'atk': 'Atk',
  'def': 'Def',
  'spa': 'SpA',
  'spd': 'SpD',
  'spe': 'Spe',
  'evasion': 'Ev',
  'accuracy': 'Acc',
};

const PokemonFieldSprite = ({ pokemon, side }: PokemonFieldSpriteProps) => {

  return (
    <div className={`${side}Pokemon`}>
      <div className='pokemonSpriteInfo'>
        <div className='pokemonDetails'>
          <span>{pokemon.name}</span>
          <span className="pokemonGender">{getGenderSymbol(pokemon.gender)}</span>
          <span className='pokemonLevel'>Lv{pokemon.level}</span>
        </div>
        <div className='pokemonHealth'>
          <ProgressBar className='pokemonHealthProgress' filled={Math.round((pokemon.hp/pokemon.maxhp)*1000)/10} color={getHealthBarColor(pokemon.maxhp, pokemon.hp)}/>
          <span>{Math.round((pokemon.hp/pokemon.maxhp)*100)}%</span>
        </div>
        <div className='pokemonStatus'>
          {
            pokemon.status ?
            (
              <img className='status' src={getStatusSymbol(pokemon.status)}/>
            ) :
            null
          }
          {
            Object.keys(pokemon.boosts).map((boost, index) => (
              <span key={index} className={`boost ${(pokemon.boosts[boost as BoostID] || 0) > 0 ? 'positive' : 'negative'}`}>
                {mapBoostStageToMultiplier(pokemon.boosts[boost as BoostID])} x {boostToLabel[boost as BoostID]}
              </span>
            ))
          }
        </div>
      </div>
      <img className={`pokemonSprite ${side}PokemonSprite`} src={Sprites.getPokemon(pokemon.baseSpeciesForme, { gender: pokemon.gender as GenderName, side }).url}/>
    </div>
  );
}

export default PokemonFieldSprite;
