import { useMemo } from "react";
import { VolumeSlider } from "../../../../VolumeSlider/VolumeSlider";
import {
  VolumePreference,
  useUserState,
} from "../../../../../../context/UserState/UserStateContext";
import movePieceMP3 from "../../../../../../assets/chessAssets/audio/movePiece.mp3";

export const SoundSettings = () => {
  const { userState, dispatch } = useUserState();
  const movePieceAudio = useMemo(() => {
    const movePieceAudio = new Audio(movePieceMP3);
    return movePieceAudio;
  }, []);

  const handleVolumeChange = (volumePreference: Partial<VolumePreference>) => {
    if (volumePreference.pieceVolume) {
      movePieceAudio.volume = volumePreference.pieceVolume;
      movePieceAudio.play();
    }
    dispatch({ type: "SET_VOLUME_PREFERENCE", payload: volumePreference });
  };

  return (
    <div className="optionsActions">
      <ul>
        <li>
          <label>Music</label>
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
          <label>Chess Sound Effects</label>
          <VolumeSlider
            initialVolume={userState.volumePreference.pieceVolume * 100}
            onVolumeUpdate={(volume) =>
              handleVolumeChange({
                pieceVolume: parseFloat((volume / 100).toFixed(2)),
              })
            }
          />
        </li>
      </ul>
    </div>
  );
};
