import { ReplayData } from "../../../util/downloadReplay";

export const validateReplay = (replayData: ReplayData) => {
  try {
    // Check top level attr
    if (
      !replayData.players ||
      !replayData.options ||
      !replayData.seed ||
      !replayData.matchHistory
    ) {
      return false;
    }

    // Check length of arrays
    if (!replayData.players.length || !replayData.matchHistory.length) {
      return false;
    }

    // Check to see if we have a white player and black player
    const whitePlayer = replayData.players.find(
      (player) => player.color === "w",
    );
    const blackPlayer = replayData.players.find(
      (player) => player.color === "b",
    );
    if (!(whitePlayer && blackPlayer)) {
      return false;
    }

    /**
     * We can probably do more validation, but it's not really worth it outside basic sanity checks
     * If a user is manipulating the replay data, then it's on them if it causes crashes.
     * Some basic sanity checking is good enough to catch people uploading something incorrect, like their tax return or something.
     */
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};
