import { Square } from "chess.js";
import { MatchLog, Timer } from "./Game.js";
import { GameOptions, GameSettings } from "./GameOptions.js";
import { Player } from "./Player.js";

export interface ServerToClientEvents {
  connectedPlayers: (players: Player[]) => void;
  changeGameOptions: (options: GameOptions) => void;
  startSync: (args: { history: MatchLog[] }, cb: () => void) => void;
  currentTimers: (timer: Timer) => void;
  startGame: (args: GameSettings, isSync?: boolean) => void;
  chatMessage: (args: { playerName: string; message: string }) => void;
  gameOutput: (log: MatchLog, ack: () => void) => void;
  endGameFromDisconnect: (args: { name: string; isHost?: boolean }) => void;
  foundMatch: (args: { roomId: string }) => void;
  roomClosed: () => void;
  kickedFromRoom: (cb?: () => void) => void;
  health: (cb: () => void) => void;
}

export interface ClientToServerEvents {
  requestChessMove: (
    args: RequestChessMoveArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
  requestDraftPokemon: (
    args: RequestDraftPokemonArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
  requestPokemonMove: (
    args: RequestPokemonMoveArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
  requestValidateTimers: (args: CommonClientArgs) => void;
  setViewingResults: (args: SetViewingResultsArgs) => void;
  requestEndGameAsHost: (
    args: CommonClientArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
  requestStartGame: (
    args: CommonClientArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
  requestToggleSpectating: (
    args: CommonClientArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
  requestChangeGameOptions: (
    args: RequestChangeGameOptionsArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
  requestKickPlayer: (
    args: RequestKickPlayerArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
  requestMovePlayerToSpectator: (
    args: RequestMovePlayerToSpectatorArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
  joinRoom: (
    args: RequestJoinGameArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
  requestSync: (args: CommonClientArgs) => void;
  sendChatMessage: (args: SendChatMessageArgs) => void;
  matchSearch: (
    args: MatchSearchArgs,
    cb: (resp: CommonServerResponse) => void,
  ) => void;
}

export interface CommonClientArgs {
  roomId: string;
  playerId: string;
  secretId: string;
}

export interface CommonServerResponse {
  status: "ok" | "err";
  message?: string;
}

interface MatchSearchArgs {
  playerName: string;
  playerId: string;
  secretId: string;
  avatarId: string;
  matchQueue: "random" | "draft";
}

interface RequestChessMoveArgs extends CommonClientArgs {
  sanMove: string;
}

interface RequestDraftPokemonArgs extends CommonClientArgs {
  square?: Square;
  draftPokemonIndex: number;
  isBan?: boolean;
}

interface RequestPokemonMoveArgs extends CommonClientArgs {
  pokemonMove: string;
}

interface SetViewingResultsArgs extends CommonClientArgs {
  viewingResults: boolean;
}

interface RequestChangeGameOptionsArgs extends CommonClientArgs {
  options: GameOptions;
}

interface RequestKickPlayerArgs extends CommonClientArgs {
  kickedPlayerId: string;
}

interface RequestMovePlayerToSpectatorArgs extends CommonClientArgs {
  spectatorPlayerId: string;
}

interface RequestJoinGameArgs extends CommonClientArgs {
  roomCode: string;
}

interface SendChatMessageArgs extends CommonClientArgs {
  message: string;
}
