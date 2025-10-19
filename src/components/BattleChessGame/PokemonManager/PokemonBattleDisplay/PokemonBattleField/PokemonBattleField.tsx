import { Battle, Pokemon, TerrainName, WeatherName } from "@pkmn/client";
import { PokemonSet } from "@pkmn/data";
import { BattleArgsKWArgType } from "@pkmn/protocol";
import { PRNG } from "@pkmn/sim";
import { LogFormatter } from "@pkmn/view";
import { useState } from "react";
import {
  CustomArgTypes,
  TerrainId,
  WeatherId,
} from "../../../../../../shared/types/PokemonTypes";
import { useUserState } from "../../../../../context/UserState/UserStateContext";
import { PokemonWeatherBackground } from "../../../../common/Pokemon/PokemonWeatherBackground/PokemonWeatherBackground";
import { PokemonBattleBackground } from "./PokemonBattleBackground/PokemonBattleBackground";
import { PokemonBattleConditions } from "./PokemonBattleCondition/PokemonBattleConditions";
import "./PokemonBattleField.css";
import { PokemonBattleText } from "./PokemonBattleText/PokemonBattleText";
import PokemonFieldSprite from "./PokemonFieldSprite/PokemonFieldSprite";

interface PokemonBattleFieldProps {
  prng: PRNG;
  battleHistory: { args: CustomArgTypes; kwArgs: BattleArgsKWArgType }[];
  logFormatter: LogFormatter;
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
  pseudoWeatherState?: Battle["field"]["pseudoWeather"];
  p1PokemonSet: PokemonSet;
  p2PokemonSet: PokemonSet;
}

const PokemonBattleField = ({
  prng,
  battleHistory,
  logFormatter,
  p1ActivePokemon,
  p2ActivePokemon,
  weatherState,
  terrainState,
  pseudoWeatherState,
  p1PokemonSet,
  p2PokemonSet,
}: PokemonBattleFieldProps) => {
  const [selectedSide, setSelectedSide] = useState<"p1" | "p2" | undefined>();
  const { userState } = useUserState();

  const handlePokemonClick = (side: "p1" | "p2") => {
    setSelectedSide((curr) => (curr === side ? undefined : side));
  };

  return (
    <PokemonBattleBackground prng={prng}>
      <PokemonWeatherBackground modifierType={weatherState?.id} />
      <PokemonWeatherBackground modifierType={terrainState?.id} />
      <PokemonWeatherBackground />
      <PokemonBattleConditions
        weatherState={weatherState}
        terrainState={terrainState}
        pseudoWeatherState={pseudoWeatherState}
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

      {userState.animationSpeedPreference >= 500 ? (
        <PokemonBattleText
          battleHistory={battleHistory}
          logFormatter={logFormatter}
        />
      ) : null}
    </PokemonBattleBackground>
  );
};

export default PokemonBattleField;
