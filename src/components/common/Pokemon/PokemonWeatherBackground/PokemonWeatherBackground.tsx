import { TerrainName, WeatherName } from "@pkmn/client";
import { TerrainId, WeatherId } from "../../../../../shared/types/PokemonTypes";
import electricTerrain from "../../../../assets/pokemonAssets/weather/weather-electricterrain.png";
import grassyTerrain from "../../../../assets/pokemonAssets/weather/weather-grassyterrain.png";
import hailWeather from "../../../../assets/pokemonAssets/weather/weather-hail.png";
import mistyTerrain from "../../../../assets/pokemonAssets/weather/weather-mistyterrain.png";
import psychicTerrain from "../../../../assets/pokemonAssets/weather/weather-psychicterrain.png";
import raindanceWeather from "../../../../assets/pokemonAssets/weather/weather-raindance.jpg";
import sandstormWeather from "../../../../assets/pokemonAssets/weather/weather-sandstorm.png";
import sunnydayWeather from "../../../../assets/pokemonAssets/weather/weather-sunnyday.jpg";
import "./PokemonWeatherBackground.css";

const getWeatherBackground = (
  weather?: WeatherId | TerrainId | WeatherName | TerrainName,
) => {
  switch (weather) {
    case "electricterrain":
    case "Electric":
      return electricTerrain;
    case "psychicterrain":
    case "Psychic":
      return psychicTerrain;
    case "grassyterrain":
    case "Grassy":
      return grassyTerrain;
    case "mistyterrain":
    case "Misty":
      return mistyTerrain;
    case "snowscape":
    case "Snow":
      return hailWeather;
    case "raindance":
    case "Rain":
      return raindanceWeather;
    case "sandstorm":
    case "Sand":
      return sandstormWeather;
    case "sunnyday":
    case "Sun":
      return sunnydayWeather;
  }
};

interface PokemonWeatherBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  modifierType?: WeatherId | TerrainId | WeatherName | TerrainName;
  className?: string;
}

export const PokemonWeatherBackground = ({
  modifierType,
  className = "",
  ...props
}: PokemonWeatherBackgroundProps) => {
  const modifierBackground = getWeatherBackground(modifierType);
  return modifierBackground ? (
    <div
      className={`pokemonWeatherBackground ${className}`}
      style={{ backgroundImage: `url(${modifierBackground})` }}
      {...props}
    />
  ) : null;
};
