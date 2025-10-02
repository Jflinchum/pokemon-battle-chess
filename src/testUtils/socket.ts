import { vi } from "vitest";
import { useSocketRequests } from "../util/useSocketRequests";

// Create a mock function that returns a resolving Promise
const createMockPromiseFn = () =>
  vi.fn().mockImplementation(() => Promise.resolve());

export const getMockSocketRequests = (overrides = {}) =>
  ({
    requestChessMove: createMockPromiseFn(),
    requestDraftPokemon: createMockPromiseFn(),
    requestBanPokemon: createMockPromiseFn(),
    requestPokemonMove: createMockPromiseFn(),
    requestValidateTimers: createMockPromiseFn(),
    requestSetViewingResults: createMockPromiseFn(),
    requestReturnEveryoneToRoom: createMockPromiseFn(),
    requestStartGame: createMockPromiseFn(),
    requestToggleSpectating: createMockPromiseFn(),
    requestChangeGameOptions: createMockPromiseFn(),
    requestKickPlayer: createMockPromiseFn(),
    requestMovePlayerToSpectator: createMockPromiseFn(),
    requestJoinGame: createMockPromiseFn(),
    requestSync: createMockPromiseFn(),
    sendChatMessage: createMockPromiseFn(),
    requestMatchSearch: createMockPromiseFn(),
    ...overrides,
  }) as ReturnType<typeof useSocketRequests>;
