import { useState } from "react";
import { Pokemon, TerrainName, WeatherName } from "@pkmn/client";
import { BattleArgsKWArgType } from "@pkmn/protocol";
import { PokemonSet } from "@pkmn/data";
import pokemonBattleBackgroundImage from "../../../../../assets/pokemonBattleBackground.png";
import PokemonFieldSprite from "./PokemonFieldSprite/PokemonFieldSprite";
import { PokemonWeatherBackground } from "../../../../common/Pokemon/PokemonWeatherBackground/PokemonWeatherBackground";
import {
  CustomArgTypes,
  TerrainId,
  WeatherId,
} from "../../../../../../shared/types/PokemonTypes";
import { PokemonBattleConditions } from "./PokemonBattleCondition/PokemonBattleConditions";
import "./PokemonBattleField.css";

interface PokemonBattleFieldProps {
  battleHistory: { args: CustomArgTypes; kwArgs: BattleArgsKWArgType }[];
  p1ActivePokemon: Pokemon | null;
  p2ActivePokemon: Pokemon | null;
  weatherState?: {
    id: WeatherName | WeatherId;
    turns: number;
  };
  terrainState?: {
    id: TerrainName | TerrainId;
    turns: number;
  };
  p1PokemonSet: PokemonSet;
  p2PokemonSet: PokemonSet;
}

const PokemonBattleField = ({
  p1ActivePokemon,
  p2ActivePokemon,
  weatherState,
  terrainState,
  p1PokemonSet,
  p2PokemonSet,
}: PokemonBattleFieldProps) => {
  const [selectedSide, setSelectedSide] = useState<"p1" | "p2" | undefined>();

  const handlePokemonClick = (side: "p1" | "p2") => {
    setSelectedSide((curr) => (curr === side ? undefined : side));
  };

  return (
    <div
      className="pokemonBattleBackground"
      style={{
        backgroundImage: `url(${pokemonBattleBackgroundImage})`,
      }}
    >
      <PokemonWeatherBackground weatherType={weatherState?.id} />
      <PokemonWeatherBackground weatherType={terrainState?.id} />
      <PokemonBattleConditions
        weatherState={weatherState}
        terrainState={terrainState}
      />
      {p1ActivePokemon && (
        <PokemonFieldSprite
          pokemon={p1ActivePokemon}
          set={p1PokemonSet}
          side="p1"
          onClick={() => handlePokemonClick("p1")}
          shouldShowDetails={selectedSide === "p1"}
          shouldHide={selectedSide === "p2"}
        />
      )}
      {p2ActivePokemon && (
        <PokemonFieldSprite
          pokemon={p2ActivePokemon}
          set={p2PokemonSet}
          side="p2"
          onClick={() => handlePokemonClick("p2")}
          shouldShowDetails={selectedSide === "p2"}
          shouldHide={selectedSide === "p1"}
        />
      )}
    </div>
  );
};

export default PokemonBattleField;
