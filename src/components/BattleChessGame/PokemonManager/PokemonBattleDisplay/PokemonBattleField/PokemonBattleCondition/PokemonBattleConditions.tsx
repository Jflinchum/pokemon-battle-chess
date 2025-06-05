import { TerrainName, WeatherName } from "@pkmn/client";
import { getSquareModifierMapping } from "../../../PokemonChessDetailsCard/getSquareModifierMapping";
import "./PokemonBattleConditions.css";
import Tooltip from "../../../../../common/Tooltip/Tooltip";
import {
  TerrainId,
  WeatherId,
} from "../../../../../../../shared/types/PokemonTypes";

const PokemonBattleConditionLabel = ({
  condition,
}: {
  condition?: {
    id: WeatherName | WeatherId | TerrainName | TerrainId;
    turns: number;
  };
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
        <span>({condition.turns} </span>
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
  weatherState,
  terrainState,
}: {
  weatherState?: {
    id: WeatherName | WeatherId;
    turns: number;
  };
  terrainState?: {
    id: TerrainName | TerrainId;
    turns: number;
  };
}) => {
  if (!weatherState && !terrainState) return null;

  return (
    <div className="pokemonBattleConditions">
      <PokemonBattleConditionLabel condition={weatherState} />
      <PokemonBattleConditionLabel condition={terrainState} />
    </div>
  );
};
