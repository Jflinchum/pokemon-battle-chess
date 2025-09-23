import { WeatherName, TerrainName } from "@pkmn/client";
import { WeatherId, TerrainId } from "../../../../../shared/types/PokemonTypes";

/**
 * Outputs a label and description of a battle field condition to be rendered to the user.
 * There will likely be extra conditions not defined here that may need to be added over time,
 * as there are plenty of pseudoweathers that pokemon has
 */
export const getSquareModifierMapping = (
  condition: WeatherId | TerrainId | WeatherName | TerrainName,
) => {
  switch (condition.toLowerCase()) {
    case "electricterrain":
    case "electric":
      return {
        label: "Electric Terrain",
        desc: "Boosts the power of Electric type moves by 50% and prevents grounded Pokémon from sleeping.",
      };
    case "psychicterrain":
    case "psychic":
      return {
        label: "Psychic Terrain",
        desc: "Boosts the power of Psychic type moves by 50% and all grounded Pokémon cannot use priority moves.",
      };
    case "grassyterrain":
    case "grassy":
      return {
        label: "Grassy Terrain",
        desc: "Boosts the power of Grass type moves by 50% and all grounded Pokémon have 1/16 of their max HP restored every turn.",
      };
    case "mistyterrain":
    case "misty":
      return {
        label: "Misty Terrain",
        desc: "Decreases the power of Dragon type moves by 50% and all grounded Pokémon cannot be affected by status conditions.",
      };
    case "snowscape":
    case "snow":
      return {
        label: "Snow",
        desc: "Boosts the Defence of Ice type Pokémon by 50%.",
      };
    case "raindance":
    case "rain":
      return {
        label: "Rain",
        desc: "Boosts the power of Water type moves by 50% and decreases the power of Fire type moves by 50%.",
      };
    case "sandstorm":
    case "sand":
      return {
        label: "Sandstorm",
        desc: "All Pokémon on the field are damaged by 1/16 of their max HP at the end of each turn, except Ground, Rock, and Steel. Rock type pokemon get a 50% Special Defense buff.",
      };
    case "sunnyday":
    case "sun":
      return {
        label: "Sun",
        desc: "Boosts the power of Fire type moves by 50% and decreases the power of Water type moves by 50%.",
      };
    case "trickroom":
      return {
        label: "Trickroom",
        desc: "Reverses the move order so that Pokémon with a lower Speed stat attack first, while those with a higher Speed stat will attack last.",
      };
    default:
      return {
        label: condition,
      };
  }
};
