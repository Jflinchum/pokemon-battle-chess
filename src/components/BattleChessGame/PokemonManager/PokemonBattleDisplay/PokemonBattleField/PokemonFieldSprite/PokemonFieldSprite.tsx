import { Pokemon } from "@pkmn/client";
import { BoostID, GenderName, PokemonSet } from "@pkmn/data";
import { mapBoostStageToMultiplier } from "../../../../../../util/pokemonUtil";
import { GenderIcon } from "../../../../../common/GenderIcon/GenderIcon";
import { PokemonSprite } from "../../../../../common/Pokemon/PokemonSprite/PokemonSprite";
import PokemonStatus from "../../../../../common/Pokemon/PokemonStatus/PokemonStatus";
import ProgressBar from "../../../../../common/ProgressBar/ProgressBar";
import Tooltip from "../../../../../common/Tooltip/Tooltip";
import { PokemonBattleDetailsCard } from "../../PokemonBattleDetails/PokemonBattleDetails";
import "./PokemonFieldSprite.css";
import { PokemonFieldSpriteEffect } from "./PokemonFieldSpriteEffect/PokemonFieldSpriteEffect";

interface PokemonFieldSpriteProps {
  pokemon: Pokemon;
  side: "p1" | "p2";
  set: PokemonSet;
  onClick: () => void;
  shouldShowDetails: boolean;
  shouldHide: boolean;
}

const getHealthBarColor = (maxHp: number, currentHp: number) => {
  const percentage = (currentHp / maxHp) * 100;
  if (percentage > 50) {
    return "green";
  } else if (percentage > 20) {
    return "yellow";
  } else {
    return "red";
  }
};

const boostToLabel: Record<BoostID, string> = {
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
  evasion: "Ev",
  accuracy: "Acc",
};

const statusToLabelMap: Record<
  string,
  { label: string; benefit: "positive" | "negative" }
> = {
  confusion: {
    label: "Confused",
    benefit: "negative",
  },
  protect: {
    label: "Protected",
    benefit: "positive",
  },
  lightscreen: {
    label: "Light Screen",
    benefit: "positive",
  },
  reflect: {
    label: "Reflect",
    benefit: "positive",
  },
};

const PokemonTooltip = ({
  pokemon,
  side,
  isOpen,
}: {
  pokemon: Pokemon;
  set: PokemonSet;
  side: "p1" | "p2";
  isOpen: boolean;
}) => {
  return (
    <Tooltip
      anchorSelect={`#${side}-pokemon`}
      place={side === "p1" ? "right" : "left"}
      isOpen={isOpen}
      clickable={isOpen}
      opacity="100"
      darkBG
    >
      <PokemonBattleDetailsCard pokemon={pokemon} />
    </Tooltip>
  );
};

const PokemonFieldSprite = ({
  pokemon,
  side,
  set,
  onClick,
  shouldShowDetails,
  shouldHide,
}: PokemonFieldSpriteProps) => {
  return (
    <>
      <div
        id={`${side}-pokemon`}
        className={`pokemonFieldSprite ${side}Pokemon ${shouldShowDetails ? "inspect" : ""} ${shouldHide ? "hide" : ""}`}
      >
        <div className="pokemonSpriteInfo">
          <div className="pokemonDetails">
            <span>{pokemon.name}</span>
            <span className="pokemonGender">
              <GenderIcon gender={pokemon.gender} />
            </span>
            <span className="pokemonLevel">Lv{pokemon.level}</span>
          </div>
          <div className="pokemonHealth">
            <ProgressBar
              className="pokemonHealthProgress"
              filled={Math.round((pokemon.hp / pokemon.maxhp) * 1000) / 10}
              color={getHealthBarColor(pokemon.maxhp, pokemon.hp)}
            />
            <span>{Math.round((pokemon.hp / pokemon.maxhp) * 100)}%</span>
          </div>
          <div className="pokemonStatus">
            <PokemonStatus status={pokemon.status} />
            {Object.keys(pokemon.volatiles).map((volatile, index) =>
              statusToLabelMap[volatile] ? (
                <span
                  key={index}
                  className={`effects ${statusToLabelMap[volatile].benefit}`}
                >
                  {statusToLabelMap[volatile].label}
                </span>
              ) : null,
            )}
            {Object.keys(pokemon.side.sideConditions).map(
              (sideCondition, index) =>
                statusToLabelMap[sideCondition] ? (
                  <span
                    key={index}
                    className={`effects ${statusToLabelMap[sideCondition].benefit}`}
                  >
                    {statusToLabelMap[sideCondition].label}
                  </span>
                ) : null,
            )}
            {Object.keys(pokemon.boosts).map((boost, index) =>
              pokemon.boosts[boost as BoostID] ? (
                <span
                  key={index}
                  className={`effects ${(pokemon.boosts[boost as BoostID] || 0) > 0 ? "positive" : "negative"}`}
                >
                  {mapBoostStageToMultiplier(pokemon.boosts[boost as BoostID])}{" "}
                  x {boostToLabel[boost as BoostID]}
                </span>
              ) : null,
            )}
          </div>
        </div>

        <div className="pokemonSpriteContainer">
          <PokemonFieldSpriteEffect pokemon={pokemon} side={side} />
          <PokemonSprite
            className={`pokemonSprite ${side}PokemonSprite ${pokemon.status || ""}`}
            isSubstitute={!!pokemon.volatiles["substitute"]}
            side={side}
            pokemonIdentifier={pokemon.speciesForme}
            gender={pokemon.gender as GenderName}
            shiny={pokemon.shiny}
            onClick={onClick}
          />
          <PokemonSprite
            className={`pokemonShadow`}
            isSubstitute={!!pokemon.volatiles["substitute"]}
            side={side}
            pokemonIdentifier={pokemon.speciesForme}
            gender={pokemon.gender as GenderName}
            shiny={pokemon.shiny}
          />
        </div>
      </div>
      <PokemonTooltip
        side={side}
        pokemon={pokemon}
        set={set}
        isOpen={shouldShowDetails}
      />
    </>
  );
};

export default PokemonFieldSprite;
