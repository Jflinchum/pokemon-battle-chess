import { useMemo } from "react";
import { VolumeSlider } from "../../../common/VolumeSlider/VolumeSlider";
import {
  VolumePreference,
  useUserState,
} from "../../../../context/UserState/UserStateContext";
import movePieceFX from "../../../../assets/chessAssets/audio/movePiece.ogg";
import damageEffectivePokemon from "../../../../assets/pokemonAssets/audio/fx/damage-effective.wav";

export const SoundSettings = () => {
  const { userState, dispatch } = useUserState();
  const movePieceAudio = useMemo(() => {
    const movePieceAudio = new Audio(movePieceFX);
    return movePieceAudio;
  }, []);

  const damageEffectAudio = useMemo(() => {
    const damageEffectAudio = new Audio(damageEffectivePokemon);
    return damageEffectAudio;
  }, []);

  const handleVolumeChange = (volumePreference: Partial<VolumePreference>) => {
    if (volumePreference.pieceVolume) {
      movePieceAudio.pause();
      movePieceAudio.currentTime = 0;
      movePieceAudio.volume = volumePreference.pieceVolume;
      movePieceAudio.play();
    }
    if (volumePreference.pokemonBattleVolume) {
      damageEffectAudio.pause();
      damageEffectAudio.currentTime = 0;
      damageEffectAudio.volume = volumePreference.pokemonBattleVolume;
      damageEffectAudio.play();
    }
    dispatch({ type: "SET_VOLUME_PREFERENCE", payload: volumePreference });
  };

  return (
    <div className="optionsActions">
      <ul>
        <li>
          <span>Music</span>
          <VolumeSlider
            initialVolume={userState.volumePreference.musicVolume * 100}
            onVolumeUpdate={(volume) =>
              handleVolumeChange({
                musicVolume: parseFloat((volume / 100).toFixed(2)),
              })
            }
          />
        </li>
        <li>
          <span>Chess Sound Effects</span>
          <VolumeSlider
            initialVolume={userState.volumePreference.pieceVolume * 100}
            onVolumeUpdate={(volume) =>
              handleVolumeChange({
                pieceVolume: parseFloat((volume / 100).toFixed(2)),
              })
            }
          />
        </li>
        <li>
          <span>Pokémon Sound Effects</span>
          <VolumeSlider
            initialVolume={userState.volumePreference.pokemonBattleVolume * 100}
            onVolumeUpdate={(volume) =>
              handleVolumeChange({
                pokemonBattleVolume: parseFloat((volume / 100).toFixed(2)),
              })
            }
          />
        </li>
      </ul>
    </div>
  );
};
