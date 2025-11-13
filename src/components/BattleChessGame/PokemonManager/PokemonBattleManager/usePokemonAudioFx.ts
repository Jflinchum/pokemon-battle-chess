import { Dex } from "@pkmn/dex";
import { BattleArgsKWArgsTypes, BattleArgsKWArgType } from "@pkmn/protocol";
import { useCallback, useEffect, useMemo } from "react";
import { CustomArgTypes } from "../../../../../shared/types/PokemonTypes";
import eatBerryPokemon from "../../../../assets/pokemonAssets/audio/fx/berry-eat.mp3";
import damageEffectivePokemon from "../../../../assets/pokemonAssets/audio/fx/damage-effective.wav";
import damageNotEffectivePokemon from "../../../../assets/pokemonAssets/audio/fx/damage-not-very-effective.wav";
import damageSuperEffectivePokemon from "../../../../assets/pokemonAssets/audio/fx/damage-super-effective.wav";
import healEffectPokemon from "../../../../assets/pokemonAssets/audio/fx/heal-effect.wav";
import activateItemPokemon from "../../../../assets/pokemonAssets/audio/fx/item-activate.mp3";
import faintEffectPokemon from "../../../../assets/pokemonAssets/audio/fx/pokemon-faint.wav";
import statDecreaseEffectPokemon from "../../../../assets/pokemonAssets/audio/fx/stat-decrease.mp3";
import statIncreaseEffectPokemon from "../../../../assets/pokemonAssets/audio/fx/stat-increase.mp3";
import statusBurnPokemon from "../../../../assets/pokemonAssets/audio/fx/status-burn.mp3";
import statusConfusePokemon from "../../../../assets/pokemonAssets/audio/fx/status-confuse.mp3";
import statusFrozenPokemon from "../../../../assets/pokemonAssets/audio/fx/status-frozen.mp3";
import statusParaPokemon from "../../../../assets/pokemonAssets/audio/fx/status-para.mp3";
import statusPoisonPokemon from "../../../../assets/pokemonAssets/audio/fx/status-poison.mp3";
import statusSleepPokemon from "../../../../assets/pokemonAssets/audio/fx/status-sleep.mp3";
import { useUserState } from "../../../../context/UserState/UserStateContext";

const getPokemonCryUrlPath = (baseSpecies: string) => {
  const mapping: Record<string, string> = {
    "kommo-o": "kommoo",
    "ho-oh": "hooh",
  };
  return mapping[baseSpecies] || baseSpecies;
};

const fetchPokemonCryUrl = (pokemon?: string) => {
  if (!pokemon) {
    return;
  }
  const dexPokemon = Dex.species.get(pokemon);
  if (!dexPokemon || !dexPokemon.baseSpecies) {
    return;
  }

  return `https://play.pokemonshowdown.com/audio/cries/${getPokemonCryUrlPath(dexPokemon.baseSpecies.toLowerCase().replace(" ", "").replace("-", ""))}.mp3`;
};

export const usePokemonAudioFx = ({
  p1PokemonSpecies,
  p2PokemonSpecies,
}: {
  p1PokemonSpecies?: string;
  p2PokemonSpecies?: string;
} = {}) => {
  const { userState } = useUserState();

  const audioEffects = useMemo(() => {
    const damageEffective = new Audio(damageEffectivePokemon);
    const damageNotEffective = new Audio(damageNotEffectivePokemon);
    const damageSuperEffective = new Audio(damageSuperEffectivePokemon);
    const statIncreaseEffect = new Audio(statIncreaseEffectPokemon);
    const statDecreaseEffect = new Audio(statDecreaseEffectPokemon);
    const healEffect = new Audio(healEffectPokemon);
    const faintEffect = new Audio(faintEffectPokemon);
    const statusBurn = new Audio(statusBurnPokemon);
    const statusConfuse = new Audio(statusConfusePokemon);
    const statusFrozen = new Audio(statusFrozenPokemon);
    const statusPara = new Audio(statusParaPokemon);
    const statusPoison = new Audio(statusPoisonPokemon);
    const statusSleep = new Audio(statusSleepPokemon);
    const eatBerry = new Audio(eatBerryPokemon);
    const activateItem = new Audio(activateItemPokemon);

    const p1PokemonCryUrl = fetchPokemonCryUrl(p1PokemonSpecies);
    const p2PokemonCryUrl = fetchPokemonCryUrl(p2PokemonSpecies);
    let p1PokemonCry;
    let p2PokemonCry;

    if (p1PokemonCryUrl) {
      p1PokemonCry = new Audio(p1PokemonCryUrl);
      p1PokemonCry.volume = userState.volumePreference.pokemonBattleVolume;
    }

    if (p2PokemonCryUrl) {
      p2PokemonCry = new Audio(p2PokemonCryUrl);
      p2PokemonCry.volume = userState.volumePreference.pokemonBattleVolume;
    }

    return {
      damageEffective,
      damageNotEffective,
      damageSuperEffective,
      statIncreaseEffect,
      statDecreaseEffect,
      healEffect,
      faintEffect,
      p1PokemonCry,
      p2PokemonCry,
      statusBurn,
      statusConfuse,
      statusFrozen,
      statusPara,
      statusPoison,
      statusSleep,
      eatBerry,
      activateItem,
    };
  }, [
    p1PokemonSpecies,
    p2PokemonSpecies,
    userState.volumePreference.pokemonBattleVolume,
  ]);

  useEffect(() => {
    audioEffects.damageEffective.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.damageNotEffective.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.damageSuperEffective.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.statIncreaseEffect.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.statDecreaseEffect.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.healEffect.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.faintEffect.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.statusBurn.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.statusConfuse.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.statusFrozen.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.statusPara.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.statusPoison.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.statusSleep.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.eatBerry.volume =
      userState.volumePreference.pokemonBattleVolume;
    audioEffects.activateItem.volume =
      userState.volumePreference.pokemonBattleVolume;
  }, [
    audioEffects.activateItem,
    audioEffects.damageEffective,
    audioEffects.damageNotEffective,
    audioEffects.damageSuperEffective,
    audioEffects.eatBerry,
    audioEffects.faintEffect,
    audioEffects.healEffect,
    audioEffects.statDecreaseEffect,
    audioEffects.statIncreaseEffect,
    audioEffects.statusBurn,
    audioEffects.statusConfuse,
    audioEffects.statusFrozen,
    audioEffects.statusPara,
    audioEffects.statusPoison,
    audioEffects.statusSleep,
    userState.volumePreference.pokemonBattleVolume,
  ]);

  const playAudio = (audio?: HTMLAudioElement) => {
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    audio.play();
  };

  const playAudioEffect = useCallback(
    (
      { args, kwArgs }: { args: CustomArgTypes; kwArgs: BattleArgsKWArgType },
      { args: previousArgs }: { args: CustomArgTypes | undefined },
    ) => {
      switch (args[0]) {
        case "-heal":
          playAudio(audioEffects.healEffect);
          break;
        case "-damage":
          switch (previousArgs?.[0]) {
            case "-resisted":
              playAudio(audioEffects.damageNotEffective);
              break;
            case "-supereffective":
              playAudio(audioEffects.damageSuperEffective);
              break;
            default:
              playAudio(audioEffects.damageEffective);
          }
          if (args[2].includes("tox") || args[2].includes("psn")) {
            playAudio(audioEffects.statusPoison);
          } else if (args[2].includes("burn")) {
            playAudio(audioEffects.statusBurn);
          }
          break;
        case "-forfeit":
        case "faint":
          if (args[1].slice(0, 2) === "p1") {
            playAudio(audioEffects.p1PokemonCry);
          } else {
            playAudio(audioEffects.p2PokemonCry);
          }
          playAudio(audioEffects.faintEffect);
          break;
        case "-boost":
          if (previousArgs?.[0] !== "-boost") {
            audioEffects.statDecreaseEffect.pause();
            playAudio(audioEffects.statIncreaseEffect);
          }
          break;
        case "-setboost":
          if (parseInt(args[3]) > 0) {
            audioEffects.statDecreaseEffect.pause();
            playAudio(audioEffects.statIncreaseEffect);
          } else if (parseInt(args[3]) < 0) {
            audioEffects.statIncreaseEffect.pause();
            playAudio(audioEffects.statDecreaseEffect);
          }
          break;
        case "-unboost":
          if (previousArgs?.[0] !== "-unboost") {
            audioEffects.statIncreaseEffect.pause();
            playAudio(audioEffects.statDecreaseEffect);
          }
          break;
        case "switch":
          if (args[1].slice(0, 2) === "p1") {
            playAudio(audioEffects.p1PokemonCry);
          } else {
            playAudio(audioEffects.p2PokemonCry);
          }
          break;
        case "-status":
          switch (args[2]) {
            case "brn":
              playAudio(audioEffects.statusBurn);
              break;
            case "frz":
              playAudio(audioEffects.statusFrozen);
              break;
            case "par":
              playAudio(audioEffects.statusPara);
              break;
            case "psn":
            case "tox":
              playAudio(audioEffects.statusPoison);
              break;
            case "slp":
              playAudio(audioEffects.statusSleep);
              break;
          }
          break;
        case "-start":
        case "-activate":
          if (args[2] === "confusion") {
            playAudio(audioEffects.statusConfuse);
          }
          break;
        case "cant":
          if (args[2] === "par") {
            playAudio(audioEffects.statusPara);
          } else if (args[2] === "frz") {
            playAudio(audioEffects.statusFrozen);
          }
          break;
        case "-enditem":
          if ((kwArgs as unknown as BattleArgsKWArgsTypes).eat) {
            playAudio(audioEffects.eatBerry);
          } else if (!(kwArgs as unknown as BattleArgsKWArgsTypes).from) {
            playAudio(audioEffects.activateItem);
          }
          break;
      }
    },
    [audioEffects],
  );

  return playAudioEffect;
};
