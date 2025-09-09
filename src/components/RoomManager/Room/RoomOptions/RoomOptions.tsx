import { useEffect, useMemo, useState } from "react";
import { BoostID, BoostsTable } from "@pkmn/data";
import { FormatID } from "../../../../context/GameState/GameStateContext";
import { GameOptions } from "../../../../../shared/types/GameOptions";
import { GameTimerOptions, TimerId } from "./GameTimerOptions/GameTimerOptions";
import "./RoomOptions.css";

const advantageOptions: { stat: BoostID; label: string }[] = [
  { stat: "atk", label: "Attack" },
  { stat: "spa", label: "Special Attack" },
  { stat: "def", label: "Defense" },
  { stat: "spd", label: "Special Defense" },
  { stat: "spe", label: "Speed" },
  { stat: "accuracy", label: "Accuracy" },
  { stat: "evasion", label: "Evasion" },
];

const formatOptions: { id: FormatID; label: string }[] = [
  { id: "random", label: "Random" },
  { id: "draft", label: "Draft" },
];

interface RoomOptionsProp {
  isHost?: boolean;
  gameOptions: GameOptions;
  onChange: (arg: GameOptions) => void;
}

const timerIdToTimerMapping: Record<
  (typeof TimerId)[number],
  { chess: number; chessInc: number; pkmnInc: number }
> = {
  "No Timer": { chess: 0, chessInc: 0, pkmnInc: 0 },
  Long: { chess: 30, chessInc: 20, pkmnInc: 10 },
  Normal: { chess: 15, chessInc: 10, pkmnInc: 5 },
  Bullet: { chess: 2, chessInc: 1, pkmnInc: 0 },
};

const getTimerIdFromTimerData = ({
  chess,
  chessInc,
  pkmnInc,
}: {
  chess: number;
  chessInc: number;
  pkmnInc: number;
}): (typeof TimerId)[number] => {
  const timer = Object.keys(timerIdToTimerMapping).find(
    (timerId) =>
      timerIdToTimerMapping[timerId as (typeof TimerId)[number]].chess ===
        chess &&
      timerIdToTimerMapping[timerId as (typeof TimerId)[number]].chessInc ===
        chessInc &&
      timerIdToTimerMapping[timerId as (typeof TimerId)[number]].pkmnInc ===
        pkmnInc,
  );
  if (!timer) {
    return "No Timer";
  }
  return timer as (typeof TimerId)[number];
};

const RoomOptions = ({ isHost, gameOptions, onChange }: RoomOptionsProp) => {
  const [gameSeed, setGameSeed] = useState("");
  const [format, setFormat] = useState<FormatID>(gameOptions.format);
  const [offenseAdvantage, setOffenseAdvantage] = useState<BoostsTable>(
    gameOptions.offenseAdvantage,
  );
  const [weatherWars, setWeatherWars] = useState<boolean>(
    gameOptions.weatherWars,
  );
  const [banTimer, setBanTimer] = useState<number>(
    gameOptions.banTimerDuration,
  );
  const currentTimerId = useMemo(
    () =>
      getTimerIdFromTimerData({
        chess: gameOptions.chessTimerDuration,
        chessInc: gameOptions.chessTimerIncrement,
        pkmnInc: gameOptions.pokemonTimerIncrement,
      }),
    [
      gameOptions.chessTimerDuration,
      gameOptions.chessTimerIncrement,
      gameOptions.pokemonTimerIncrement,
    ],
  );
  const [timerId, setTimerId] =
    useState<(typeof TimerId)[number]>(currentTimerId);

  useEffect(() => {
    onChange({
      gameSeed,
      format,
      offenseAdvantage,
      weatherWars,
      timersEnabled: timerId !== "No Timer",
      banTimerDuration: banTimer,
      chessTimerDuration: timerIdToTimerMapping[timerId].chess,
      chessTimerIncrement: timerIdToTimerMapping[timerId].chessInc,
      pokemonTimerIncrement: timerIdToTimerMapping[timerId].pkmnInc,
    });
  }, [
    format,
    offenseAdvantage,
    weatherWars,
    banTimer,
    timerId,
    gameSeed,
    onChange,
  ]);

  return (
    <div className="roomOptionsContainer">
      <h3>Room Options</h3>
      <ul className="roomOptionsList">
        {import.meta.env.DEV ? (
          <li className="roomOption">
            <div className="roomOptionLabel">
              <label htmlFor="seed">Pokemon Generation Seed:</label>
              <p>DEV ONLY - Sets the seed used for generating Pokemon.</p>
            </div>
            <input
              value={gameSeed}
              onChange={(e) => setGameSeed(e.target.value)}
              name="seed"
              disabled={!isHost}
            />
          </li>
        ) : null}
        <li className="roomOption">
          <div className="roomOptionLabel">
            <label htmlFor="format">Pokemon Assignments:</label>
            <p>
              Random will randomly assign a Pokemon to each chess piece and then
              start the match.
            </p>
            <p>
              Draft will give players a shared pool of Pokemon to choose from.
              After taking turns banning from the pool, players can then assign
              Pokemon to their piece of choice.
            </p>
          </div>
          <select
            value={gameOptions.format}
            onChange={(e) => setFormat(e.target.value as FormatID)}
            name="format"
            disabled={!isHost}
          >
            {formatOptions.map((format) => (
              <option value={format.id} key={format.id}>
                {format.label}
              </option>
            ))}
          </select>
        </li>
        <li className="roomOption">
          <div className="roomOptionLabel">
            <label htmlFor="format">Weather Wars:</label>
            <p>
              Enabling this mode will create different weather and terrain
              effects on random chess squares. These weather and terrain effects
              will come and go throughout the match.
            </p>
          </div>
          <input
            checked={gameOptions.weatherWars}
            type="checkbox"
            onChange={(e) => setWeatherWars(e.target.checked)}
          />
        </li>
        <hr></hr>
        <li className="roomOption">
          <div className="roomOptionLabel">
            <label>Offense Advantage:</label>
            <p>
              If a chess piece attacks another, this will decide what buffs they
              get at the start of the match.
            </p>
          </div>
          <ul>
            {advantageOptions
              .filter(({ stat }) => stat !== "accuracy" && stat !== "evasion")
              .map((adv) => (
                <li key={adv.stat}>
                  <select
                    name={adv.stat}
                    disabled={!isHost}
                    value={gameOptions.offenseAdvantage[adv.stat]}
                    onChange={(e) =>
                      setOffenseAdvantage({
                        ...offenseAdvantage,
                        [adv.stat]: parseInt(e.target.value),
                      })
                    }
                  >
                    {Array.from({ length: 7 }).map((_, index) => (
                      <option value={index} key={index}>
                        +{index}
                      </option>
                    ))}
                  </select>
                  <label htmlFor={adv.stat}>{adv.label}</label>
                </li>
              ))}
          </ul>
        </li>
        <hr></hr>
        <li className="roomOption">
          <div className="roomOptionLabel">
            <label htmlFor="gameTimer">Game Timer:</label>
            <p>
              Adds a timer to the game. If players run out of time during the
              draft/ban phase, a random pokemon will be chosen and randomly
              assigned. If players run out of time in the match, then they will
              lose.
            </p>
            <p>
              Long is 30 minutes. Normal is 15 minutes. Bullet is 2 minutes.
              Each move you make in game will prolong your timer.
            </p>
          </div>
          <GameTimerOptions
            timerId={currentTimerId}
            onChange={setTimerId}
            disabled={!isHost}
          />
        </li>
        {gameOptions.format === "draft" && currentTimerId !== "No Timer" && (
          <li className="roomOption">
            <div className="roomOptionLabel">
              <label htmlFor="banTimer">Draft/Ban Timer:</label>
              <p>
                Amount of time (in seconds) that the player has to ban and draft
                a pokemon.
              </p>
            </div>
            <select
              className="roomOptionBanTimer"
              name="banTimerDuration"
              value={gameOptions.banTimerDuration}
              onChange={(e) => setBanTimer(parseInt(e.target.value))}
              disabled={!isHost}
            >
              {import.meta.env.DEV ? <option value={1}>1 second</option> : null}
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={45}>45 seconds</option>
              <option value={60}>60 seconds</option>
            </select>
          </li>
        )}
      </ul>
    </div>
  );
};

export default RoomOptions;
