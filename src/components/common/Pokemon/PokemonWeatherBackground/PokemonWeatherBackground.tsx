import electricTerrain from '../../../../assets/pokemonAssets/weather/weather-electricterrain.png';
import psychicTerrain from '../../../../assets/pokemonAssets/weather/weather-psychicTerrain.png';
import grassyTerrain from '../../../../assets/pokemonAssets/weather/weather-grassyterrain.png';
import mistyTerrain from '../../../../assets/pokemonAssets/weather/weather-mistyterrain.png';
import hailWeather from '../../../../assets/pokemonAssets/weather/weather-hail.png';
import raindanceWeather from '../../../../assets/pokemonAssets/weather/weather-raindance.jpg';
import sandstormWeather from '../../../../assets/pokemonAssets/weather/weather-sandstorm.png';
import sunnydayWeather from '../../../../assets/pokemonAssets/weather/weather-sunnyday.jpg';
import { WeatherId, TerrainId } from '../../../../../shared/types/PokemonTypes';
import './PokemonWeatherBackground.css';
import { TerrainName, WeatherName } from '@pkmn/client';

const getWeatherBackground = (weather?: WeatherId | TerrainId | WeatherName | TerrainName) => {
  switch (weather) {
    case 'electricterrain':
    case 'Electric':
      return electricTerrain;
    case 'psychicterrain':
    case 'Psychic':
      return psychicTerrain;
    case 'grassyterrain':
    case 'Grassy':
      return grassyTerrain;
    case 'mistyterrain':
    case 'Misty':
      return mistyTerrain;
    case 'snowscape':
    case 'Snow':
      return hailWeather;
    case 'raindance':
    case 'Rain':
      return raindanceWeather;
    case 'sandstorm':
    case 'Sand':
      return sandstormWeather;
    case 'sunnyday':
    case 'Sun':
      return sunnydayWeather;
  }
}

export const PokemonWeatherBackground = ({ weatherType, className = '' }: { weatherType?: WeatherId | TerrainId | WeatherName | TerrainName; className?: string }) => {
  const weatherBackground = getWeatherBackground(weatherType);
  return (
    weatherBackground ?
      (<div className={`pokemonWeatherBackground ${className}`} style={{ backgroundImage: `url(${weatherBackground})` }} />) :
      null
  );
}