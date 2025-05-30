import { Pokemon } from "@pkmn/client";
import { Dex } from "@pkmn/dex";
import { BoostID, GenderName, PokemonSet } from "@pkmn/data";
import ProgressBar from "../../../../../common/ProgressBar/ProgressBar";
import PokemonStatus from "../../../../../common/Pokemon/PokemonStatus/PokemonStatus";
import PokemonType from "../../../../../common/Pokemon/PokemonType/PokemonType";
import Tooltip from "../../../../../common/Tooltip/Tooltip";
import { GenderIcon } from "../../../../../common/GenderIcon/GenderIcon";
import { PokemonSprite } from "../../../../../common/Pokemon/PokemonSprite/PokemonSprite";
import "./PokemonFieldSprite.css";

interface PokemonFieldSpriteProps {
  pokemon: Pokemon;
  side: "p1" | "p2";
  set: PokemonSet;
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
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
  evasion: "Ev",
  accuracy: "Acc",
};

const PokemonTooltip = ({
  pokemon,
  set,
  side,
}: {
  pokemon: Pokemon;
  set: PokemonSet;
  side: "p1" | "p2";
}) => {
  return (
    <Tooltip anchorSelect={`#${side}-${pokemon.name.split(" ").join("-")}`}>
      <div>
        <strong>{set.name} </strong>
        <GenderIcon gender={pokemon.gender} />
        <span>L{set.level}</span>
      </div>
      <p>
        {pokemon.types.map((type, index) => (
          <PokemonType
            className="pokemonTooltipTyping"
            key={index}
            type={type}
          />
        ))}
      </p>
      <hr />
      <div>
        <p>
          <b>Ability:</b> {set.ability}
        </p>
        <p>
          <b>Item:</b> {set.item}
        </p>
        <p>
          <b>Moves:</b>{" "}
          {set.moves.map((move, index) => (
            <span key={index}>
              {Dex.moves.get(move).name}
              {index === set.moves.length - 1 ? " " : ", "}
            </span>
          ))}
        </p>
      </div>
    </Tooltip>
  );
};

const PokemonFieldSprite = ({
  pokemon,
  side,
  set,
}: PokemonFieldSpriteProps) => {
  return (
    <div
      id={`${side}-${pokemon.name.split(" ").join("-")}`}
      className={`pokemonFieldSprite ${side}Pokemon`}
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
          {Object.keys(pokemon.boosts).map((boost, index) =>
            pokemon.boosts[boost as BoostID] ? (
              <span
                key={index}
                className={`boost ${(pokemon.boosts[boost as BoostID] || 0) > 0 ? "positive" : "negative"}`}
              >
                {mapBoostStageToMultiplier(pokemon.boosts[boost as BoostID])} x{" "}
                {boostToLabel[boost as BoostID]}
              </span>
            ) : null,
          )}
        </div>
      </div>

      <PokemonSprite
        className={`pokemonSprite ${side}PokemonSprite`}
        isSubstitute={!!pokemon.volatiles["substitute"]}
        side={side}
        pokemonIdentifier={pokemon.speciesForme}
        gender={pokemon.gender as GenderName}
        shiny={pokemon.shiny}
      />
      <PokemonTooltip side={side} pokemon={pokemon} set={set} />
    </div>
  );
};

export default PokemonFieldSprite;
