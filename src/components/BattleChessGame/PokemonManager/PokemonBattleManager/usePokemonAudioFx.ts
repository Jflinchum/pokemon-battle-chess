import { useMemo, useCallback } from "react";
import { useUserState } from "../../../../context/UserState/UserStateContext";
import damageEffectivePokemon from "../../../../assets/pokemonAssets/audio/fx/damage-effective.wav";
import damageNotEffectivePokemon from "../../../../assets/pokemonAssets/audio/fx/damage-not-very-effective.wav";
import damageSuperEffectivePokemon from "../../../../assets/pokemonAssets/audio/fx/damage-super-effective.wav";
import statIncreaseEffectPokemon from "../../../../assets/pokemonAssets/audio/fx/stat-increase.mp3";
import statDecreaseEffectPokemon from "../../../../assets/pokemonAssets/audio/fx/stat-decrease.mp3";
import healEffectPokemon from "../../../../assets/pokemonAssets/audio/fx/heal-effect.wav";
import faintEffectPokemon from "../../../../assets/pokemonAssets/audio/fx/pokemon-faint.wav";
import { CustomArgTypes } from "../../../../../shared/types/PokemonTypes";
import { Dex } from "@pkmn/dex";

const fetchPokemonCryUrl = (pokemon?: string) => {
  if (!pokemon) {
    return;
  }
  const dexPokemon = Dex.species.get(pokemon);
  if (!dexPokemon || !dexPokemon.baseSpecies) {
    return;
  }

  return `https://play.pokemonshowdown.com/audio/cries/${dexPokemon.baseSpecies.toLowerCase().replace(" ", "")}.mp3`;
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
    damageEffective.volume = userState.volumePreference.pokemonBattleVolume;
    const damageNotEffective = new Audio(damageNotEffectivePokemon);
    damageNotEffective.volume = userState.volumePreference.pokemonBattleVolume;
    const damageSuperEffective = new Audio(damageSuperEffectivePokemon);
    damageSuperEffective.volume =
      userState.volumePreference.pokemonBattleVolume;
    const statIncreaseEffect = new Audio(statIncreaseEffectPokemon);
    statIncreaseEffect.volume = userState.volumePreference.pokemonBattleVolume;
    const statDecreaseEffect = new Audio(statDecreaseEffectPokemon);
    statDecreaseEffect.volume = userState.volumePreference.pokemonBattleVolume;
    const healEffect = new Audio(healEffectPokemon);
    healEffect.volume = userState.volumePreference.pokemonBattleVolume;
    const faintEffect = new Audio(faintEffectPokemon);
    faintEffect.volume = userState.volumePreference.pokemonBattleVolume;

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
    };
  }, [userState.volumePreference.pokemonBattleVolume]);

  const playAudio = (audio?: HTMLAudioElement) => {
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    audio.play();
  };

  const playAudioEffect = useCallback(
    (args: CustomArgTypes, previousArgs: CustomArgTypes | undefined) => {
      if (args[0] === "-heal") {
        playAudio(audioEffects.healEffect);
      } else if (args[0] === "-damage") {
        if (previousArgs?.[0] === "-resisted") {
          playAudio(audioEffects.damageNotEffective);
        } else if (previousArgs?.[0] === "-supereffective") {
          playAudio(audioEffects.damageSuperEffective);
        } else {
          playAudio(audioEffects.damageEffective);
        }
      } else if (args[0] === "-forfeit" || args[0] === "faint") {
        if (args[1].slice(0, 2) === "p1") {
          playAudio(audioEffects.p1PokemonCry);
        } else {
          playAudio(audioEffects.p2PokemonCry);
        }
        playAudio(audioEffects.faintEffect);
      } else if (
        args[0] === "-boost" ||
        (args[0] === "-setboost" && parseInt(args[3]) > 0)
      ) {
        audioEffects.statDecreaseEffect.pause();
        playAudio(audioEffects.statIncreaseEffect);
      } else if (
        args[0] === "-unboost" ||
        (args[0] === "-setboost" && parseInt(args[3]) < 0)
      ) {
        audioEffects.statIncreaseEffect.pause();
        playAudio(audioEffects.statDecreaseEffect);
      } else if (args[0] === "switch") {
        console.log(args);
        if (args[1].slice(0, 2) === "p1") {
          playAudio(audioEffects.p1PokemonCry);
        } else {
          playAudio(audioEffects.p2PokemonCry);
        }
      }
    },
    [audioEffects],
  );

  return playAudioEffect;
};
