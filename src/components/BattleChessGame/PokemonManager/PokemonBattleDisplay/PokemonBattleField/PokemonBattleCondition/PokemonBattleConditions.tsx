import { Field, WeatherName } from "@pkmn/client";
import { getSquareModifierMapping } from "../../../PokemonChessDetailsCard/PokemonChessDetailsCard";
import './PokemonBattleConditions.css';

const PokemonBattleConditionLabel = ({ condition }: { condition?: Field['terrainState'] | Field['weatherState'] }) => {
  if (!condition || !condition.id) return null;

  return (
    <p>
      <span>{getSquareModifierMapping(condition.id as WeatherName)?.label} </span>
      <span>({condition.minDuration} </span>
      {condition.maxDuration > 0 && (
        <span>or {condition.maxDuration} </span>
      )}
      <span>turns)</span>
    </p>
  );
}

export const PokemonBattleConditions = ({ battleField }: { battleField: Field }) => {
  console.log('battleField', battleField);
  return (
    <div className='pokemonBattleConditions'>
      <PokemonBattleConditionLabel condition={battleField.weatherState} />
      <PokemonBattleConditionLabel condition={battleField.terrainState} />
      { battleField.pseudoWeather && Object.keys(battleField.pseudoWeather).map((weather) => {
        return (
          <PokemonBattleConditionLabel key={weather} condition={battleField.pseudoWeather[weather] as Field['weatherState']}/>
        )
      })}
    </div>
  );
}