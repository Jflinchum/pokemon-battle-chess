export const mapBoostStageToMultiplier = (stage?: number): number => {
  if (!stage) {
    return 1;
  } else if (stage > 0) {
    return parseFloat(`${(stage + 2) / 2}`.slice(0, 4));
  } else {
    return parseFloat(`${2 / (2 - stage)}`.slice(0, 4));
  }
};
