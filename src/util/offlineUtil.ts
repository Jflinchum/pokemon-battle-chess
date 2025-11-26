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
  cpuChessDifficulty: (typeof cpuDifficultyLevels)[number],
  cpuPokemonDifficulty: (typeof cpuDifficultyLevels)[number],
) => {
  const difficultyLevels = ["Easy", "Medium", "Hard"];
  const chessNum = difficultyLevels.indexOf(cpuChessDifficulty);
  const pokemonNum = difficultyLevels.indexOf(cpuPokemonDifficulty);
  switch (chessNum + pokemonNum) {
    case 0:
      return "12";
    case 1:
      return "130";
    case 2:
      return "294";
    case 3:
      return "148";
    case 4:
      return "260";

    default:
      return "12";
  }
};

export const getCpuPlayerData = ({
  playerSide,
  cpuChessDifficulty,
  cpuPokemonDifficulty,
}: {
  playerSide: "p1" | "p2";
  cpuChessDifficulty: (typeof cpuDifficultyLevels)[number];
  cpuPokemonDifficulty: (typeof cpuDifficultyLevels)[number];
}): Player => ({
  ...connectedPlayerDefaults,
  playerName: "CPU",
  playerId: getCpuPlayerId({ playerSide }),
  avatarId: getCpuAvatarId(cpuChessDifficulty, cpuPokemonDifficulty),
  isPlayer1: playerSide === "p1",
  isPlayer2: playerSide === "p2",
});
