import bwSubwayTrainer from "../assets/pokemonAssets/audio/music/battle/bw-subway-trainer.ogg";
import bw2Rival from "../assets/pokemonAssets/audio/music/battle/bw2-rival.ogg";
import colosseumMirorB from "../assets/pokemonAssets/audio/music/battle/colosseum-miror-b.ogg";
import dppTrainer from "../assets/pokemonAssets/audio/music/battle/dpp-trainer.ogg";
import hgssJohtoTrainer from "../assets/pokemonAssets/audio/music/battle/hgss-johto-trainer.ogg";
import orasRival from "../assets/pokemonAssets/audio/music/battle/oras-rival.ogg";
import orasTrainer from "../assets/pokemonAssets/audio/music/battle/oras-trainer.ogg";
import smTrainer from "../assets/pokemonAssets/audio/music/battle/sm-trainer.ogg";
import xyRival from "../assets/pokemonAssets/audio/music/battle/xy-rival.ogg";

import bwDriftveilCity from "../assets/pokemonAssets/audio/music/outOfBattle/bw-driftveil-city.mp3";
import bwRoute10City from "../assets/pokemonAssets/audio/music/outOfBattle/bw-route10.mp3";
import dppDawn from "../assets/pokemonAssets/audio/music/outOfBattle/dpp-dawn.mp3";
import dppEternaForest from "../assets/pokemonAssets/audio/music/outOfBattle/dpp-eterna-forest.mp3";
import dppLake from "../assets/pokemonAssets/audio/music/outOfBattle/dpp-lake.mp3";
import jubilifeCityNight from "../assets/pokemonAssets/audio/music/outOfBattle/jubilife-city-night.mp3";
import orasOldale from "../assets/pokemonAssets/audio/music/outOfBattle/oras-oldale.mp3";
import xyBoutique from "../assets/pokemonAssets/audio/music/outOfBattle/xy-boutique.mp3";

export const BATTLE_MUSIC = [
  bwSubwayTrainer,
  bw2Rival,
  colosseumMirorB,
  dppTrainer,
  hgssJohtoTrainer,
  orasRival,
  orasTrainer,
  smTrainer,
  xyRival,
];

export const OUT_OF_BATTLE_MUSIC = [
  bwDriftveilCity,
  bwRoute10City,
  dppDawn,
  dppEternaForest,
  dppLake,
  jubilifeCityNight,
  orasOldale,
  xyBoutique,
];

export const getRandomBattleMusic = () => {
  return BATTLE_MUSIC[Math.floor(Math.random() * BATTLE_MUSIC.length)];
};

export const getRandomOutOfBattleMusic = () => {
  return OUT_OF_BATTLE_MUSIC[
    Math.floor(Math.random() * OUT_OF_BATTLE_MUSIC.length)
  ];
};
