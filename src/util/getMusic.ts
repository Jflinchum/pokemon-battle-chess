// Battle music
import bwSubwayTrainer from "../assets/pokemonAssets/audio/music/battle/bw-subway-trainer.ogg";
import bw2Rival from "../assets/pokemonAssets/audio/music/battle/bw2-rival.ogg";
import colosseumMirorB from "../assets/pokemonAssets/audio/music/battle/colosseum-miror-b.ogg";
import dppTrainer from "../assets/pokemonAssets/audio/music/battle/dpp-trainer.ogg";
import hgssJohtoTrainer from "../assets/pokemonAssets/audio/music/battle/hgss-johto-trainer.ogg";
import orasRival from "../assets/pokemonAssets/audio/music/battle/oras-rival.ogg";
import orasTrainer from "../assets/pokemonAssets/audio/music/battle/oras-trainer.ogg";
import smTrainer from "../assets/pokemonAssets/audio/music/battle/sm-trainer.ogg";
import xyRival from "../assets/pokemonAssets/audio/music/battle/xy-rival.ogg";

// Out of battle music
import bwDriftveilCity from "../assets/pokemonAssets/audio/music/outOfBattle/bw-driftveil-city.mp3";
import bwRoute10City from "../assets/pokemonAssets/audio/music/outOfBattle/bw-route10.mp3";
import dppDawn from "../assets/pokemonAssets/audio/music/outOfBattle/dpp-dawn.mp3";
import dppEternaForest from "../assets/pokemonAssets/audio/music/outOfBattle/dpp-eterna-forest.mp3";
import dppLake from "../assets/pokemonAssets/audio/music/outOfBattle/dpp-lake.mp3";
import jubilifeCityNight from "../assets/pokemonAssets/audio/music/outOfBattle/jubilife-city-night.mp3";
import orasOldale from "../assets/pokemonAssets/audio/music/outOfBattle/oras-oldale.mp3";
import xyBoutique from "../assets/pokemonAssets/audio/music/outOfBattle/xy-boutique.mp3";

// Special Battle Music
import bwNTheme from "../assets/pokemonAssets/audio/music/battle/bw-n-theme.mp3";
import bw2LanceTheme from "../assets/pokemonAssets/audio/music/battle/bw2-lance-theme.mp3";
import laVoloTheme from "../assets/pokemonAssets/audio/music/battle/la-volo-theme.mp3";
import orasWallyTheme from "../assets/pokemonAssets/audio/music/battle/oras-wally-theme.mp3";
import orasZinniaTheme from "../assets/pokemonAssets/audio/music/battle/oras-zinnia-theme.mp3";
import swshBattleTower from "../assets/pokemonAssets/audio/music/battle/swsh-battle-tower-theme.mp3";
import xyDianthaTheme from "../assets/pokemonAssets/audio/music/battle/xy-diantha-theme.mp3";

// Pokemon Themes
import bdspDialgaPalkia from "../assets/pokemonAssets/audio/music/battle/bdsp-dialga-palkia.mp3";
import laOriginDialgaPalkia from "../assets/pokemonAssets/audio/music/battle/la-origin-dialga-palkia.mp3";
import orasHoOh from "../assets/pokemonAssets/audio/music/battle/oras-ho-oh.mp3";
import orasReshiramZekrom from "../assets/pokemonAssets/audio/music/battle/oras-reshiram-zekrom.mp3";
import rsGroudonKyogreRayquayza from "../assets/pokemonAssets/audio/music/battle/rs-kyogre-groudon-rayquayza.mp3";
import smSolgaleoLunalaNecrozma from "../assets/pokemonAssets/audio/music/battle/sm-solagleo-lunala-necrozma.mp3";
import swshRegiTheme from "../assets/pokemonAssets/audio/music/battle/swsh-regi-theme.mp3";
import swshZacianZamazenta from "../assets/pokemonAssets/audio/music/battle/swsh-zacian-zamazenta.mp3";
import usumXerneasYveltalZygarde from "../assets/pokemonAssets/audio/music/battle/usum-xerneas-yveltal-zygarde.mp3";

export const POKEMON_THEMES: Record<string, string> = {
  zekrom: orasReshiramZekrom,
  reshiram: orasReshiramZekrom,
  dialga: bdspDialgaPalkia,
  palkia: bdspDialgaPalkia,
  "dialga-origin": laOriginDialgaPalkia,
  "palkia-origin": laOriginDialgaPalkia,
  "ho-oh": orasHoOh,
  zacian: swshZacianZamazenta,
  zamazenta: swshZacianZamazenta,
  groudon: rsGroudonKyogreRayquayza,
  kyogre: rsGroudonKyogreRayquayza,
  rayquayza: rsGroudonKyogreRayquayza,
  regirock: swshRegiTheme,
  regiice: swshRegiTheme,
  registeel: swshRegiTheme,
  regidraco: swshRegiTheme,
  regieleki: swshRegiTheme,
  regigigas: swshRegiTheme,
  xerneas: usumXerneasYveltalZygarde,
  yveltal: usumXerneasYveltalZygarde,
  zygarde: usumXerneasYveltalZygarde,
  solagaleo: smSolgaleoLunalaNecrozma,
  lunala: smSolgaleoLunalaNecrozma,
  necrozma: smSolgaleoLunalaNecrozma,
};

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

export const SPECIAL_BATTLE_MUSIC = [
  laVoloTheme,
  bw2LanceTheme,
  bwNTheme,
  orasZinniaTheme,
  orasWallyTheme,
  swshBattleTower,
  xyDianthaTheme,
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

export const getSpecialBattleMusic = (
  p1PokemonIdentifier?: string,
  p2PokemonIdentifier?: string,
) => {
  if (
    p2PokemonIdentifier &&
    POKEMON_THEMES[p2PokemonIdentifier.toLowerCase()]
  ) {
    return POKEMON_THEMES[p2PokemonIdentifier.toLowerCase()];
  } else if (
    p1PokemonIdentifier &&
    POKEMON_THEMES[p1PokemonIdentifier.toLowerCase()]
  ) {
    return POKEMON_THEMES[p1PokemonIdentifier.toLowerCase()];
  } else {
    return SPECIAL_BATTLE_MUSIC[
      Math.floor(Math.random() * SPECIAL_BATTLE_MUSIC.length)
    ];
  }
};

export const getRandomOutOfBattleMusic = () => {
  return OUT_OF_BATTLE_MUSIC[
    Math.floor(Math.random() * OUT_OF_BATTLE_MUSIC.length)
  ];
};
