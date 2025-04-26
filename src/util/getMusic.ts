import bwSubwayTrainer from '../assets/pokemonAssets/audio/music/battle/bw-subway-trainer.ogg';
import dppTrainer from '../assets/pokemonAssets/audio/music/battle/dpp-trainer.ogg';

import dppLake from '../assets/pokemonAssets/audio/music/outOfBattle/dpp-lake.mp3';
import jubilifeCityNight from '../assets/pokemonAssets/audio/music/outOfBattle/jubilife-city-night.mp3'

export const BATTLE_MUSIC = [
  bwSubwayTrainer,
  dppTrainer
];

export const OUT_OF_BATTLE_MUSIC = [
  dppLake,
  jubilifeCityNight,
];

export const getRandomBattleMusic = () => {
  return BATTLE_MUSIC[Math.floor(Math.random()*BATTLE_MUSIC.length)];
}

export const getRandomOutOfBattleMusic = () => {
  return OUT_OF_BATTLE_MUSIC[Math.floor(Math.random()*OUT_OF_BATTLE_MUSIC.length)];
}