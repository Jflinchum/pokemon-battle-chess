import { useUserState } from "../../../../context/UserState/UserStateContext";
import { ToggleSwitch } from "../../../common/ToggleSwitch/ToggleSwitch";
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

  const handlePremovingChange = (enablePremove: boolean) => {
    dispatch({
      type: "SET_PREMOVING_PREFERENCE",
      payload: enablePremove,
    });
  };

  return (
    <div className="optionsActions">
      <ul>
        <li>
          <label htmlFor="game-speed-select">Game Speed</label>
          <select
            id="game-speed-select"
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
          <div className="gameSettingsDescription">
            Changes the speed of various animations within the game. Primarily
            impacts Pokémon battles.
          </div>
          <hr className="gameSettingsSpacer" />
        </li>
        <li>
          <label htmlFor="2dSpritesOption">Use Pokémon 2D Sprites</label>
          <ToggleSwitch
            id="2dSpritesOption"
            className="gameSettingsInput"
            checked={userState.use2DSprites}
            onChange={(e) => handle2DSpriteChange(e.target.checked)}
          />
          <div className="gameSettingsDescription">
            Changes the Pokémon sprites to be animated in 2D. Similar to the
            style of Pokémon Black and White.
          </div>
          <hr className="gameSettingsSpacer" />
        </li>
        <li>
          <label htmlFor="disableAnimatedBackground">
            Disable Animated Background
          </label>
          <ToggleSwitch
            id="disableAnimatedBackground"
            className="gameSettingsInput"
            checked={!userState.animatedBackgroundEnabled}
            onChange={(e) => handleAnimatedBackgroundChange(!e.target.checked)}
          />
          <div className="gameSettingsDescription">
            Disables the animated floating background in the main menu of the
            game.
          </div>
          <hr className="gameSettingsSpacer" />
        </li>
        <li>
          <label htmlFor="enablePremoving">Enable Chess Premoving</label>
          <ToggleSwitch
            id="enablePremoving"
            className="gameSettingsInput"
            checked={userState.enablePremoving}
            onChange={(e) => handlePremovingChange(e.target.checked)}
          />
          <div className="gameSettingsDescription">
            Allows you to queue up Chess moves while it isn't your turn. You can
            clear the queue by right clicking the chess board.
          </div>
          <hr className="gameSettingsSpacer" />
        </li>
      </ul>
    </div>
  );
};
