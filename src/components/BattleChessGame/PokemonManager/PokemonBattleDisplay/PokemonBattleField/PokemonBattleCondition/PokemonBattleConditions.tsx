import { Field, TerrainName, WeatherName } from "@pkmn/client";
import { getSquareModifierMapping } from "../../../PokemonChessDetailsCard/getSquareModifierMapping";
import "./PokemonBattleConditions.css";
import Tooltip from "../../../../../common/Tooltip/Tooltip";

const PokemonBattleConditionLabel = ({
  condition,
}: {
  condition?: Field["terrainState"] | Field["weatherState"];
}) => {
  if (!condition || !condition.id) return null;

  return (
    <>
      <p id={`battleCondition-${condition.id}`}>
        <span>
          {
            getSquareModifierMapping(condition.id as WeatherName | TerrainName)
              ?.label
          }{" "}
        </span>
        <span>({condition.minDuration} </span>
        {condition.maxDuration > 0 && <span>or {condition.maxDuration} </span>}
        <span>turns)</span>
      </p>
      <Tooltip darkBG anchorSelect={`#battleCondition-${condition.id}`}>
        {
          getSquareModifierMapping(condition.id as WeatherName | TerrainName)
            ?.desc
        }
      </Tooltip>
    </>
  );
};

export const PokemonBattleConditions = ({
  battleField,
}: {
  battleField: Field;
}) => {
  if (!battleField.weatherState.id && !battleField.terrainState.id) return null;

  return (
    <div className="pokemonBattleConditions">
      <PokemonBattleConditionLabel condition={battleField.weatherState} />
      <PokemonBattleConditionLabel condition={battleField.terrainState} />
      {battleField.pseudoWeather &&
        Object.keys(battleField.pseudoWeather).map((weather) => {
          return (
            <PokemonBattleConditionLabel
              key={weather}
              condition={
                battleField.pseudoWeather[weather] as Field["weatherState"]
              }
            />
          );
        })}
    </div>
  );
};
