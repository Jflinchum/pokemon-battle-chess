import { useUserState } from "../../../../../../context/UserState/UserStateContext";
import "./GameSettings.css";

const animationSpeedMap: Record<string, string> = {
  1500: "Slow",
  1000: "Normal",
  500: "Fast",
  100: "Instant",
};

export const GameSettings = () => {
  const { userState, dispatch } = useUserState();

  const handleAnimationSpeedPreferenceChange = (animationSpeed: number) => {
    dispatch({
      type: "SET_ANIMATION_SPEED_PREFERENCE",
      payload: animationSpeed,
    });
  };

  const handle2DSpriteChange = (use2DSprites: boolean) => {
    dispatch({ type: "SET_2D_SPRITE_PREFERENCE", payload: use2DSprites });
  };

  const handleAnimatedBackgroundChange = (
    animatedBackgroundPreference: boolean,
  ) => {
    dispatch({
      type: "SET_ANIMATED_BACKGROUND_PREFERENCE",
      payload: animatedBackgroundPreference,
    });
  };

  return (
    <div className="optionsActions">
      <ul>
        <li>
          <label>Game Speed</label>
          <select
            value={userState.animationSpeedPreference}
            onChange={(e) =>
              handleAnimationSpeedPreferenceChange(parseInt(e.target.value))
            }
          >
            {Object.keys(animationSpeedMap).map((speed) => (
              <option key={speed} value={speed}>
                {animationSpeedMap[speed]}
              </option>
            ))}
          </select>
        </li>
        <li>
          <label htmlFor="2dSpritesOption">Use Pokémon 2D Sprites</label>
          <input
            id="2dSpritesOption"
            className="gameSettingsInput"
            type="checkbox"
            checked={userState.use2DSprites}
            onChange={(e) => handle2DSpriteChange(e.target.checked)}
          />
        </li>
        <li>
          <label htmlFor="disableAnimatedBackground">
            Disable Animated Background
          </label>
          <input
            id="disableAnimatedBackground"
            className="gameSettingsInput"
            type="checkbox"
            checked={!userState.animatedBackgroundEnabled}
            onChange={(e) => handleAnimatedBackgroundChange(!e.target.checked)}
          />
        </li>
      </ul>
    </div>
  );
};
