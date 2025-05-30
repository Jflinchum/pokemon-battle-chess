import { useMemo } from "react";
import { Battle } from "@pkmn/client";
import { BattleArgsKWArgType } from "@pkmn/protocol";
import { PokemonSet } from "@pkmn/data";
import pokemonBattleBackgroundImage from "../../../../../assets/pokemonBattleBackground.png";
import PokemonFieldSprite from "./PokemonFieldSprite/PokemonFieldSprite";
import { useGameState } from "../../../../../context/GameState/GameStateContext";
import { PokemonWeatherBackground } from "../../../../common/Pokemon/PokemonWeatherBackground/PokemonWeatherBackground";
import {
  CustomArgTypes,
  WeatherId,
} from "../../../../../../shared/types/PokemonTypes";
import { PokemonBattleConditions } from "./PokemonBattleCondition/PokemonBattleConditions";
import "./PokemonBattleField.css";

interface PokemonBattleFieldProps {
  battleState: Battle;
  battleHistory: { args: CustomArgTypes; kwArgs: BattleArgsKWArgType }[];
  p1PokemonSet: PokemonSet;
  p2PokemonSet: PokemonSet;
}

const PokemonBattleField = ({
  battleState,
  p1PokemonSet,
  p2PokemonSet,
}: PokemonBattleFieldProps) => {
  const { gameState } = useGameState();
  const p1Pokemon = useMemo(
    () =>
      gameState.gameSettings.color === "w"
        ? battleState.p1.active[0]
        : battleState.p2.active[0],
    [
      battleState.p1.active,
      battleState.p2.active,
      gameState.gameSettings.color,
    ],
  );
  const p2Pokemon = useMemo(
    () =>
      gameState.gameSettings.color === "w"
        ? battleState.p2.active[0]
        : battleState.p1.active[0],
    [
      gameState.gameSettings.color,
      battleState.p1.active,
      battleState.p2.active,
    ],
  );

  return (
    <div
      className="pokemonBattleBackground"
      style={{
        backgroundImage: `url(${pokemonBattleBackgroundImage})`,
      }}
    >
      <PokemonWeatherBackground
        weatherType={
          battleState.field.weather ||
          (Object.keys(battleState.field.pseudoWeather)[0] as WeatherId)
        }
      />
      <PokemonWeatherBackground weatherType={battleState.field.terrain} />
      <PokemonBattleConditions battleField={battleState.field} />
      {p1Pokemon && (
        <PokemonFieldSprite pokemon={p1Pokemon} set={p1PokemonSet} side="p1" />
      )}
      {p2Pokemon && (
        <PokemonFieldSprite pokemon={p2Pokemon} set={p2PokemonSet} side="p2" />
      )}
    </div>
  );
};

export default PokemonBattleField;
