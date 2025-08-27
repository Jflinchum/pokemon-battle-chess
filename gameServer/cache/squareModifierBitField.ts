import { Square } from "chess.js";
import { SquareModifier } from "../../shared/models/PokemonBattleChessManager.js";
import { TerrainId, WeatherId } from "../../shared/types/PokemonTypes.js";
import { getSquareIndexIn1DArray } from "../../shared/util/chessSquareIndex.js";

const weatherTerrainBitMapping: Record<WeatherId | TerrainId, number> = {
  sandstorm: 0b00,
  sunnyday: 0b01,
  raindance: 0b10,
  snowscape: 0b11,
  electricterrain: 0b00,
  grassyterrain: 0b01,
  psychicterrain: 0b10,
  mistyterrain: 0b11,
};

const weatherBitMap: Record<number, WeatherId> = {
  0: "sandstorm",
  1: "sunnyday",
  2: "raindance",
  3: "snowscape",
};

const terrainBitMap: Record<number, TerrainId> = {
  0: "electricterrain",
  1: "grassyterrain",
  2: "psychicterrain",
  3: "mistyterrain",
};

/**
 * The square on a chess board can be converted into a 6 bit number, since there are 64 squares total
 * The weather id can be converted into a 2 bit number, since there are 4 weather types
 * The terrain id can be converted into a 2 bit number, since there are 4 terrain types
 * The duration of each is a variable number between 2 and 5 (as of this comment). I don't anticipate needing to preserve more than 8 bits total (4 for terrain and 4 for weather)
 * Total bits needed for bit field = 18
 *
 * NOTE: There can be no weather but terrain and vice versa. Since we're not including "no weather" or "no terrain" in the bit field, it will be represented as 00 if there is
 * no weather or terrain. A duration of 0 will be set in this case to indicate ignoring the weather or terrain when unpacking it
 *
 * @param squareModifier The square modifier to turn into a bit field
 */
export const packSquareModifierIntoBitField = (
  squareModifier: SquareModifier,
): number => {
  // square_weather_duration_terrain_duration
  let bitFieldState = 0b000000_00_0000_00_0000;

  const squareIndex = getSquareIndexIn1DArray(squareModifier.square);

  const weatherTypeBits = squareModifier.modifiers.weather
    ? weatherTerrainBitMapping[squareModifier.modifiers.weather.id]
    : 0b00;
  const weatherDurationBits = squareModifier.modifiers.weather
    ? squareModifier.modifiers.weather.duration
    : 0b0000;

  const terrainTypeBits = squareModifier.modifiers.terrain
    ? weatherTerrainBitMapping[squareModifier.modifiers.terrain.id]
    : 0b00;
  const terrainDurationBits = squareModifier.modifiers.terrain
    ? squareModifier.modifiers.terrain.duration
    : 0b0000;

  bitFieldState |= squareIndex << 12;
  bitFieldState |= weatherTypeBits << 10;
  bitFieldState |= weatherDurationBits << 6;
  bitFieldState |= terrainTypeBits << 4;
  bitFieldState |= terrainDurationBits;
  return bitFieldState;
};

export const unpackSquareModifierFromBitField = (
  bitField: number,
): SquareModifier => {
  const squareIndexMask = 63 << 12;
  const squareIndex = (bitField & squareIndexMask) >> 12;

  const weatherTypeMask = 3 << 10;
  const weatherDurationMask = 15 << 6;
  const weatherType = (bitField & weatherTypeMask) >> 10;
  const weatherDuration = (bitField & weatherDurationMask) >> 6;

  const terrainTypeMask = 3 << 4;
  const terrainDurationMask = 15;
  const terrainType = (bitField & terrainTypeMask) >> 4;
  const terrainDuration = bitField & terrainDurationMask;

  const squareModifier: Partial<SquareModifier> = {
    square:
      `${String.fromCharCode(97 + Math.floor(squareIndex % 8))}${8 - Math.floor(squareIndex / 8)}` as Square,
    modifiers: {
      weather: {
        id: weatherBitMap[weatherType],
        duration: weatherDuration,
      },
      terrain: {
        id: terrainBitMap[terrainType],
        duration: terrainDuration,
      },
    },
  };

  if (weatherDuration === 0) {
    delete squareModifier.modifiers?.weather;
  }

  if (terrainDuration === 0) {
    delete squareModifier.modifiers?.terrain;
  }

  if (
    !squareModifier.modifiers?.weather &&
    !squareModifier.modifiers?.terrain
  ) {
    throw Error(
      `Unable to unpack bitfield correctly: ${JSON.stringify(squareModifier)}`,
    );
  }

  return squareModifier as SquareModifier;
};
