import { WeatherId, TerrainId } from "../../shared/types/PokemonTypes.js";

export const mapWeatherIdToName = (weatherId: WeatherId): string => {
  switch (weatherId) {
    case "sandstorm":
      return "Sandstorm";
    case "sunnyday":
      return "SunnyDay";
    case "raindance":
      return "RainDance";
    case "snowscape":
      return "Snowscape";
    default:
      return weatherId;
  }
};

export const mapTerrainIdToName = (terrainId: TerrainId): string => {
  switch (terrainId) {
    case "electricterrain":
      return "Electric Terrain";
    case "grassyterrain":
      return "Grassy Terrain";
    case "psychicterrain":
      return "Psychic Terrain";
    case "mistyterrain":
      return "Misty Terrain";
    default:
      return terrainId;
  }
};
