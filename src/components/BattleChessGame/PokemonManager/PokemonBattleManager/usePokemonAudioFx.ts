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

export const usePokemonAudioFx = () => {
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

    return {
      damageEffective,
      damageNotEffective,
      damageSuperEffective,
      statIncreaseEffect,
      statDecreaseEffect,
      healEffect,
      faintEffect,
    };
  }, [userState.volumePreference.pokemonBattleVolume]);

  const playAudio = (audio: HTMLAudioElement) => {
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
      }
    },
    [audioEffects],
  );

  return playAudioEffect;
};
