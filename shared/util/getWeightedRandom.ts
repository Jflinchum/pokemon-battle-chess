import { PRNG } from "@pkmn/sim";

/**
 * Utility function to get a random value from an array of objects based on their weights.
 * @param weightedValues - An array of objects containing a weight and a value.
 * @returns A randomly selected value based on the weights provided.
 */
export const getWeightedRandom = (
  weightedValues: { weight: number; value: number }[],
  prng: PRNG,
) => {
  const totalWeight = weightedValues.reduce(
    (acc, { weight }) => acc + weight,
    0,
  );
  const randomValue = prng.random() * totalWeight;
  let cumulativeWeight = 0;

  for (const { value, weight } of weightedValues) {
    cumulativeWeight += weight;
    if (randomValue < cumulativeWeight) {
      return value;
    }
  }
  return weightedValues[0].value; // Fallback in case of rounding errors
};
