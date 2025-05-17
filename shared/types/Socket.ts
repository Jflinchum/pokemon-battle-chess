import { Square } from "chess.js";
import { GameOptions, GameSettings } from "./GameOptions";
import { Player } from './Player';
import { MatchLog, Timer } from "./game";

export interface ServerToClientEvents {
  connectedPlayers: (players: Player[]) => void;
  changeGameOptions: (options: GameOptions) => void;
  startSync: (args: { history: MatchLog[] }) => void;
  currentTimers: (timer: Timer) => void;
  startGame: (args: GameSettings, isSync?: boolean) => void;
  chatMessage: (args: { playerName: string; message: string; }) => void;
  gameOutput: (log: MatchLog, ack: () => void) => void;
  endGameFromDisconnect: (args: { name: string, isHost?: boolean }) => void;
  roomClosed: () => void;
  kickedFromRoom: (cb?: () => void) => void;
  health: (cb: () => void) => void;
}

export interface ClientToServerEvents {
  requestChessMove: (args: RequestChessMoveArgs) => void;
  requestDraftPokemon: (args: RequestDraftPokemonArgs) => void;
  requestPokemonMove: (args: RequestPokemonMoveArgs, cb: () => void) => void;
  setViewingResults: (args: SetViewingResultsArgs) => void;
  requestEndGameAsHost: (args: CommonClientArgs) => void;
  requestStartGame: (args: CommonClientArgs) => void;
  requestToggleSpectating: (args: CommonClientArgs) => void;
  requestChangeGameOptions: (args: RequestChangeGameOptionsArgs) => void;
  requestKickPlayer: (args: RequestKickPlayerArgs) => void;
  requestMovePlayerToSpectator: (args: RequestMovePlayerToSpectatorArgs) => void;
  joinRoom: (args: RequestJoinGameArgs) => void;
  requestSync: (args: CommonClientArgs) => void;
  sendChatMessage: (args: SendChatMessageArgs) => void;
};

export interface CommonClientArgs {
  roomId: string;
  playerId: string;
  secretId: string;
};

interface RequestChessMoveArgs extends CommonClientArgs {
  sanMove: string;
};

interface RequestDraftPokemonArgs extends CommonClientArgs {
  square?: Square;
  draftPokemonIndex: number;
  isBan?: boolean;
};

interface RequestPokemonMoveArgs extends CommonClientArgs {
  pokemonMove: string;
};

interface SetViewingResultsArgs extends CommonClientArgs {
  viewingResults: boolean;
};

interface RequestChangeGameOptionsArgs extends CommonClientArgs {
  options: GameOptions;
};

interface RequestKickPlayerArgs extends CommonClientArgs {
  kickedPlayerId: string;
};

interface RequestMovePlayerToSpectatorArgs extends CommonClientArgs {
  spectatorPlayerId: string;
};

interface RequestJoinGameArgs extends CommonClientArgs {
  roomCode: string;
};

interface SendChatMessageArgs extends CommonClientArgs {
  message: string;
};