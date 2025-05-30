import { useMemo } from "react";
import { Pokemon } from "@pkmn/client";
import { TypeName } from "@pkmn/data";
import { Dex } from "@pkmn/dex";
import PokemonType from "../../../../common/Pokemon/PokemonType/PokemonType";
import Tooltip from "../../../../common/Tooltip/Tooltip";
import { GenderIcon } from "../../../../common/GenderIcon/GenderIcon";
import { PokemonMoveTooltip } from "../PokemonMoveTooltip/PokemonMoveTooltip";
import "./PokemonBattleDetails.css";

export const PokemonBattleDetailsCard = ({
  pokemon,
}: {
  pokemon: Pokemon | null;
}) => {
  const dexPokemon = Dex.species.get(pokemon?.speciesForme || "");

  const { weaknesses, resistances, immunities } = useMemo(() => {
    const weaknesses: TypeName[] = [];
    const resistances: TypeName[] = [];
    const immunities: TypeName[] = [];
    if (!dexPokemon) {
      return { weaknesses, resistances, immunities };
    }
    Dex.types.names().map((type) => {
      const notImmune = Dex.getImmunity(type, dexPokemon.types);
      const typeModifier = Dex.getEffectiveness(type, dexPokemon.types);
      if (!notImmune) {
        immunities.push(type as TypeName);
      }
      if (notImmune && typeModifier > 0) {
        weaknesses.push(type as TypeName);
      }
      if (notImmune && typeModifier < 0) {
        resistances.push(type as TypeName);
      }
    });
    return { weaknesses, resistances, immunities };
  }, [dexPokemon]);

  if (!pokemon) {
    return null;
  }

  return (
    <>
      <div className="pokemonBattleDetailsCard">
        <div className="pokemonBattleDetailsCardSet">
          <span>
            {dexPokemon.types.map((type) => (
              <PokemonType
                key={type}
                type={type}
                className="pokemonBattleDetailsCardSetType"
              />
            ))}
          </span>
          <span className="pokemonBattleDetailsCardName">
            <span>{pokemon.baseSpeciesForme}</span>
            <GenderIcon gender={pokemon.gender} />
            <span>Lv{pokemon.level}</span>
          </span>
          <span id={`ability-${pokemon.baseSpeciesForme.split(" ").join("-")}`}>
            <strong>Ability: </strong>
            {pokemon.set?.ability}
          </span>
          <span id={`item-${pokemon.baseSpeciesForme.split(" ").join("-")}`}>
            <strong>Item: </strong>
            {Dex.items.get(pokemon.item || "").name}
          </span>
          <span>
            <strong>Moves: </strong>
            {pokemon.set?.moves.map((move, index) => (
              <span key={index}>
                <span
                  id={`${move.split(" ").join("-")}-${pokemon.baseSpeciesForme.split(" ").join("-")}`}
                >
                  {Dex.moves.get(move).name}
                  {index === (pokemon.set?.moves.length || 0) - 1 ? " " : ", "}
                </span>
              </span>
            ))}
          </span>
          {weaknesses.length > 0 && (
            <span>
              <b>Weaknesses: </b>
              <div>
                {weaknesses.map((type) => (
                  <PokemonType
                    key={type}
                    type={type as TypeName}
                    className="pokemonBattleDetailsTyping"
                  />
                ))}
              </div>
            </span>
          )}
          {resistances.length > 0 && (
            <span>
              <b>Resistances: </b>
              <div>
                {resistances.map((type) => (
                  <PokemonType
                    key={type}
                    type={type as TypeName}
                    className="pokemonBattleDetailsTyping"
                  />
                ))}
              </div>
            </span>
          )}
          {immunities.length > 0 && (
            <span>
              <b>Immunities: </b>
              <div>
                {immunities.map((type) => (
                  <PokemonType
                    key={type}
                    type={type as TypeName}
                    className="pokemonBattleDetailsTyping"
                  />
                ))}
              </div>
            </span>
          )}
        </div>
      </div>
      {pokemon.set?.moves.map((move, index) => (
        <Tooltip
          key={index}
          className="pokemonBattleDetailsCardSetTooltip"
          anchorSelect={`#${move.split(" ").join("-")}-${pokemon.baseSpeciesForme.split(" ").join("-")}`}
        >
          <PokemonMoveTooltip move={move} />
        </Tooltip>
      ))}
      <Tooltip
        className="pokemonBattleDetailsCardSetTooltip"
        anchorSelect={`#ability-${pokemon.baseSpeciesForme.split(" ").join("-")}`}
      >
        {Dex.abilities.get(pokemon.set?.ability || "").shortDesc}
      </Tooltip>
      <Tooltip
        className="pokemonBattleDetailsCardSetTooltip"
        anchorSelect={`#item-${pokemon.baseSpeciesForme.split(" ").join("-")}`}
      >
        {Dex.items.get(pokemon.item).shortDesc}
      </Tooltip>
    </>
  );
};
