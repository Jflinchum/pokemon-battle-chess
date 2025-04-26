import { useMemo } from "react";
import { VolumePreference, useUserState } from "../../../../../context/UserStateContext";
import { VolumeSlider } from "../../../VolumeSlider/VolumeSlider";
import movePieceMP3 from '../../../../../assets/chessAssets/audio/movePiece.mp3';
import './OptionsModal.css';

const animationSpeedMap: Record<string, string> = {
  1500: 'Slow',
  1000: 'Normal',
  500: 'Fast',
  100: 'Instant',
};

const OptionsModal = () => {
  const { userState, dispatch: userStateDispatch } = useUserState();

  const movePieceAudio = useMemo(() => {
    const movePieceAudio = new Audio(movePieceMP3);
    return movePieceAudio;
  }, []);

  const handleAnimationSpeedPreferenceChange = (animationSpeed: number) => {
    userStateDispatch({ type: 'SET_ANIMATION_SPEED_PREFERENCE', payload: animationSpeed });
  };

  const handleVolumeChange = (volumePreference: Partial<VolumePreference>) => {
    if (volumePreference.pieceVolume) {
      movePieceAudio.volume = volumePreference.pieceVolume;
      movePieceAudio.play();
    }
    userStateDispatch({ type: 'SET_VOLUME_PREFERENCE', payload: volumePreference });
  };

  return (
    <div className='optionsModalContainer'>
      <h2 className='optionsTitle'>Options</h2>
      <div className='optionsActions'>
        <ul>
          <li>
            <label>Game Speed</label>
            <select value={userState.animationSpeedPreference} onChange={(e) => handleAnimationSpeedPreferenceChange(parseInt(e.target.value))}>
              {
                Object.keys(animationSpeedMap).map((speed) => (
                  <option
                    key={speed}
                    value={speed}
                  >
                    {animationSpeedMap[speed]}
                  </option>
                ))
              }
            </select>
          </li>
          <li>
            <label>Chess Sound Effects</label>
            <VolumeSlider initialVolume={userState.volumePreference.pieceVolume * 100} onVolumeUpdate={(volume) => handleVolumeChange({ pieceVolume: parseFloat((volume / 100).toFixed(2)) })}/>
          </li>
          <li>
            <label>Music</label>
            <VolumeSlider initialVolume={userState.volumePreference.musicVolume * 100} onVolumeUpdate={(volume) => handleVolumeChange({ musicVolume: parseFloat((volume / 100).toFixed(2)) })}/>
          </li>
        </ul>
      </div>
    </div>
  )
};

export default OptionsModal;