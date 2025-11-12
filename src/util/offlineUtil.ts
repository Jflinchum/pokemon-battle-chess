import { Player } from "../../shared/types/Player";

const connectedPlayerDefaults = {
  isPlayer1: false,
  isPlayer2: false,
  isHost: false,
  viewingResults: false,
  transient: false,
  color: null,
  isSpectator: false,
};

export const cpuPlayerId = "offline-cpu";
export const offlineRoomId = "offline";

export const cpuDifficultyLevels = ["Easy", "Medium", "Hard"] as const;

export const getOfflinePlayerData = ({
  playerName,
  playerId,
  avatarId,
}: Pick<Player, "playerName" | "playerId" | "avatarId">): Player => ({
  ...connectedPlayerDefaults,
  playerName,
  playerId,
  avatarId,
  isPlayer1: true,
  isHost: true,
});

export const getCpuPlayerId = ({ playerSide }: { playerSide: "p1" | "p2" }) =>
  `${cpuPlayerId}-${playerSide}`;

export const getCpuAvatarId = (
  cpuDifficulty: (typeof cpuDifficultyLevels)[number],
) => {
  switch (cpuDifficulty) {
    case "Easy":
      return "12";
    case "Medium":
      return "294";
    case "Hard":
      return "260";

    default:
      return "12";
  }
};

export const getCpuPlayerData = ({
  playerSide,
  cpuDifficulty,
}: {
  playerSide: "p1" | "p2";
  cpuDifficulty: (typeof cpuDifficultyLevels)[number];
}): Player => ({
  ...connectedPlayerDefaults,
  playerName: "CPU",
  playerId: getCpuPlayerId({ playerSide }),
  avatarId: getCpuAvatarId(cpuDifficulty),
  isPlayer1: playerSide === "p1",
  isPlayer2: playerSide === "p2",
});
