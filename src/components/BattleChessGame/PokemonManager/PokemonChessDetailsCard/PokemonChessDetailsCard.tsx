import { GenderName, PokemonSet, TypeName } from "@pkmn/data";
import { Dex } from "@pkmn/dex";
import { Icons } from "@pkmn/img";
import { useMemo } from "react";
import { SquareModifier } from "../../../../../shared/models/PokemonBattleChessManager";
import { ChessData } from "../../../../../shared/types/Game.js";
import shinyIcon from "../../../../assets/pokemonAssets/shiny.png";
import { GenderIcon } from "../../../common/GenderIcon/GenderIcon";
import { PokemonSprite } from "../../../common/Pokemon/PokemonSprite/PokemonSprite";
import PokemonType from "../../../common/Pokemon/PokemonType/PokemonType";
import { PokemonWeatherBackground } from "../../../common/Pokemon/PokemonWeatherBackground/PokemonWeatherBackground";
import Tooltip from "../../../common/Tooltip/Tooltip";
import ChessMoveHistory from "../../ChessManager/ChessMoveHistory/ChessMoveHistory";
import PokemonMoveChoices from "../PokemonBattleDisplay/PokemonMoveChoices/PokemonMoveChoices";
import { getSquareModifierMapping } from "./getSquareModifierMapping";
import "./PokemonChessDetailsCard.css";

interface PokemonChessDetailsCardProps {
  pokemon?: PokemonSet | null;
  chessMoveHistory?: ChessData[];
  squareModifier?: SquareModifier;
  minimizeOnColumnLayout?: boolean;
}

const PokemonChessDetailsCard = ({
  pokemon,
  chessMoveHistory = [],
  squareModifier,
  minimizeOnColumnLayout,
}: PokemonChessDetailsCardProps) => {
  const dexPokemon = useMemo(
    () => (pokemon ? Dex.species.get(pokemon.species) : null),
    [pokemon],
  );

  const squareModArray = useMemo(() => {
    return Object.keys(squareModifier?.modifiers || {})
      .map((squareMod) => {
        const weatherOrTerrain =
          squareModifier?.modifiers?.[squareMod as "weather" | "terrain"];
        if (weatherOrTerrain) {
          return {
            id: weatherOrTerrain.id,
            duration: weatherOrTerrain.duration,
          };
        }
      })
      .filter((squareMod) => squareMod);
  }, [squareModifier]);

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

  return (
    <>
      <div
        className={`pokemonDetailsContainer ${minimizeOnColumnLayout ? "minimize" : ""}`}
      >
        <div className="pokemonDetailsPadding">
          <div className="pokemonDetailsTitle">
            <div>
              {squareModArray.map(
                (squareMod) =>
                  squareMod && (
                    <div
                      key={squareMod.id}
                      id={`squareMod-${squareMod.id}`}
                      className="pokemonDetailsSquareModifier"
                    >
                      <PokemonWeatherBackground
                        modifierType={squareMod.id}
                        className="detailsCardWeather"
                      />
                      <span>
                        {getSquareModifierMapping(squareMod.id)?.label} -{" "}
                        {squareMod.duration} battles
                      </span>
                    </div>
                  ),
              )}
            </div>
            {pokemon && (
              <div className="pokemonDetailsIdentifierAndType">
                <p className="pokemonDetailsIdentifier">
                  <span>{pokemon.name}</span>
                  <GenderIcon gender={pokemon.gender} />
                  <span>Lv{pokemon.level}</span>
                  {pokemon.shiny && (
                    <img
                      src={shinyIcon}
                      className="pokemonDetailsShiny"
                      alt="Shiny Pokemon icon"
                    />
                  )}
                </p>
                <div className="pokemonDetailsTypingContainer">
                  {Dex.species.get(pokemon.species).types.map((type) => (
                    <PokemonType
                      className="pokemonDetailsTyping"
                      type={type}
                      key={type}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          {pokemon && dexPokemon ? (
            <>
              <div className="pokemonDetailsCard">
                <div>
                  <div className="pokemonDetailsSpriteContainer">
                    <PokemonSprite
                      className="pokemonDetailsSprite"
                      pokemonIdentifier={pokemon.species}
                      gender={pokemon.gender as GenderName}
                      shiny={pokemon.shiny}
                    />
                  </div>
                  <PokemonMoveChoices
                    moves={pokemon.moves.map((move) => ({ id: move }))}
                  />
                </div>
                <ul>
                  <li>
                    <span>
                      <b>Item: </b>
                      <div
                        id={`${pokemon.item.split(" ").join("-").replace("'", "")}`}
                        className="pokemonDetailsItemContainer"
                      >
                        {pokemon.item && (
                          <div style={Icons.getItem(pokemon.item).css} />
                        )}
                        <span>{pokemon.item || "None"}</span>
                      </div>
                    </span>
                  </li>
                  <li>
                    <span>
                      <b>Ability: </b>
                      <div
                        id={`${pokemon.ability.split(" ").join("-").replace("'", "")}`}
                      >
                        <span>{pokemon.ability || "None"}</span>
                      </div>
                    </span>
                  </li>
                  {weaknesses.length > 0 && (
                    <li>
                      <b>Weaknesses: </b>
                      <div>
                        {weaknesses.map((type) => (
                          <PokemonType
                            key={type}
                            type={type as TypeName}
                            className="pokemonDetailsTyping"
                          />
                        ))}
                      </div>
                    </li>
                  )}
                  {resistances.length > 0 && (
                    <li>
                      <b>Resistances: </b>
                      <div>
                        {resistances.map((type) => (
                          <PokemonType
                            key={type}
                            type={type as TypeName}
                            className="pokemonDetailsTyping"
                          />
                        ))}
                      </div>
                    </li>
                  )}
                  {immunities.length > 0 && (
                    <li>
                      <b>Immunities: </b>
                      <div>
                        {immunities.map((type) => (
                          <PokemonType
                            key={type}
                            type={type as TypeName}
                            className="pokemonDetailsTyping"
                          />
                        ))}
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </>
          ) : (
            <div className="pokemonDetailsChessMoveHistory">
              <ChessMoveHistory chessMoveHistory={chessMoveHistory} />
            </div>
          )}
        </div>
      </div>
      {
        // Necessary to render this outside of above div to prevent tooltips from scrolling the container
        pokemon ? (
          <>
            <Tooltip
              anchorSelect={`#${pokemon.ability.split(" ").join("-").replace("'", "")}`}
            >
              {Dex.abilities.get(pokemon.ability).shortDesc}
            </Tooltip>
            {pokemon.item ? (
              <Tooltip
                anchorSelect={`#${pokemon.item.split(" ").join("-").replace("'", "")}`}
              >
                {Dex.items.get(pokemon.item).shortDesc}
              </Tooltip>
            ) : null}
          </>
        ) : null
      }
      {squareModArray.map((squareMod, index) =>
        squareMod ? (
          <Tooltip key={index} anchorSelect={`#squareMod-${squareMod.id}`}>
            {getSquareModifierMapping(squareMod.id)?.desc}
          </Tooltip>
        ) : null,
      )}
    </>
  );
};

export default PokemonChessDetailsCard;
