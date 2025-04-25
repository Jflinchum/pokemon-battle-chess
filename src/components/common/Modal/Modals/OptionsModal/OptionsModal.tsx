import { useUserState } from "../../../../../context/UserStateContext";
import './OptionsModal.css';

const animationSpeedMap: Record<string, string> = {
  1500: 'Slow',
  1000: 'Normal',
  500: 'Fast',
  100: 'Instant',
};

const OptionsModal = () => {
  const { userState, dispatch: userStateDispatch } = useUserState();

  const handleAnimationSpeedPreferenceChange = (animationSpeed: number) => {
    userStateDispatch({ type: 'SET_ANIMATION_SPEED_PREFERENCE', payload: animationSpeed })
  };

  return (
    <div className='optionsModalContainer'>
      <h2 className='optionsTitle'>Options</h2>
      <div className='optionsActions'>
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
      </div>
    </div>
  )
};

export default OptionsModal;