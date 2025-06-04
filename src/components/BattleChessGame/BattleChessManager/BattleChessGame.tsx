import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  RefObject,
} from "react";
import { toast } from "react-toastify";
import { Color, Chess, Square } from "chess.js";
import { ArgType, KWArgType } from "@pkmn/protocol";
import { PokemonSet } from "@pkmn/data";
import {
  PokemonBattleChessManager,
  SquareModifier,
} from "../../../../shared/models/PokemonBattleChessManager";
import {
  getCastledRookSquare,
  getVerboseSanChessMove,
  mergeBoardAndPokemonState,
} from "../ChessManager/util";
import useBattleHistory from "./useBattleHistory";
import { useUserState } from "../../../context/UserState/UserStateContext";
import { useModalState } from "../../../context/ModalState/ModalStateContext";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { CurrentBattle } from "./BattleChessManager";
import { useSocketRequests } from "../../../util/useSocketRequests";
import { useMusicPlayer } from "../../../util/useMusicPlayer";
import movePieceMP3 from "../../../assets/chessAssets/audio/movePiece.mp3";
import capturePieceMP3 from "../../../assets/chessAssets/audio/capturePiece.mp3";
import Spinner from "../../common/Spinner/Spinner";
import ChessManager from "../ChessManager/ChessManager";
import PokemonBattleManager from "../PokemonManager/PokemonBattleManager/PokemonBattleManager";
import {
  ChessData,
  EndGameReason,
  MatchHistory,
} from "../../../../shared/types/game";
import DraftPokemonManager from "../DraftPokemonManager/DraftPokemonManager";

export const BattleChessGame = ({
  matchHistory,
  chessManager,
  pokemonManager,
  demoMode,
  color,
  matchLogIndex,
  pokemonLogIndex,
  draftMode,
}: {
  matchHistory?: MatchHistory;
  pokemonManager: PokemonBattleChessManager;
  chessManager: Chess;
  demoMode?: boolean;
  draftMode?: boolean;
  color: Color;
  matchLogIndex: RefObject<number>;
  pokemonLogIndex: RefObject<number>;
}) => {
  const { userState } = useUserState();
  const { dispatch: modalStateDispatch } = useModalState();
  const { gameState, dispatch } = useGameState();

  const [currentBattle, setCurrentBattle] = useState<CurrentBattle | null>(
    null,
  );
  const [battleStarted, setBattleStarted] = useState(false);
  const [currentPokemonBoard, setCurrentPokemonBoard] = useState(
    mergeBoardAndPokemonState(chessManager.board(), pokemonManager),
  );
  const [isDrafting, setIsDrafting] = useState<boolean>(!!draftMode);
  const [draftTurnPick, setDraftTurnPick] = useState<Color>("w");
  const [mostRecentMove, setMostRecentMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [currentPokemonMoveHistory, setCurrentPokemonMoveHistory] = useState<
    { args: ArgType; kwArgs: KWArgType }[]
  >([]);
  const errorRecoveryAttempts = useRef(0);
  // The timeout to start/end the pokemon battle when initiating one.
  const battleTimeout = useRef<NodeJS.Timeout | null>(null);

  const { movePieceAudio, capturePieceAudio } = useMemo(() => {
    const movePieceAudio = new Audio(movePieceMP3);
    const capturePieceAudio = new Audio(capturePieceMP3);
    movePieceAudio.volume = userState.volumePreference.pieceVolume;
    capturePieceAudio.volume = userState.volumePreference.pieceVolume;
    return {
      movePieceAudio,
      capturePieceAudio,
    };
  }, [userState.volumePreference.pieceVolume]);

  useEffect(() => {
    if (gameState.matchEnded) {
      setBattleStarted(false);
      setCurrentBattle(null);
    }
  }, [gameState.matchEnded]);

  const { playRandomGlobalSong, playRandomBattleSong } = useMusicPlayer();

  const {
    requestChessMove,
    requestDraftPokemon,
    requestBanPokemon,
    requestSync,
  } = useSocketRequests();

  const onBan = useCallback(
    (draftPokemonIndex: number) => {
      pokemonManager.banDraftPiece(draftPokemonIndex);
      setDraftTurnPick((curr) => (curr === "w" ? "b" : "w"));
    },
    [pokemonManager],
  );

  const onDraft = useCallback(
    (square: Square, draftPokemonIndex: number, color: Color) => {
      const chessSquare = chessManager.get(square)!;
      pokemonManager.assignPokemonToSquare(
        draftPokemonIndex,
        square,
        chessSquare.type,
        color,
      );
      setCurrentPokemonBoard(
        mergeBoardAndPokemonState(chessManager.board(), pokemonManager),
      );
      setDraftTurnPick((curr) => (curr === "w" ? "b" : "w"));
      setIsDrafting(!!pokemonManager.draftPieces.length);
    },
    [chessManager, pokemonManager],
  );

  const resetMatchHistory = useCallback(() => {
    matchLogIndex.current = 0;
    pokemonLogIndex.current = 0;
    dispatch({ type: "SET_SKIPPING_AHEAD", payload: true });
    requestSync();
  }, [dispatch, requestSync, matchLogIndex, pokemonLogIndex]);

  const handleError = useCallback(
    (err: Error) => {
      if (errorRecoveryAttempts.current < 3) {
        toast("Oops! We encountered an error. Attempting to recover...", {
          type: "error",
        });
        console.log(`Encountered error: ${err.message}. Attempting resync.`);
        console.log(err.stack);
        chessManager.reset();
        pokemonManager.reset();
        resetMatchHistory();
        errorRecoveryAttempts.current++;
      } else {
        toast(
          "Error: Could not recover from game bug. Please refresh and try to reconnect.",
          { type: "error" },
        );
        console.log("Max error recovery attempts reached.");
      }
    },
    [pokemonManager, chessManager, errorRecoveryAttempts, resetMatchHistory],
  );

  const onMove = useCallback(
    ({ sanMove, moveFailed }: { sanMove: string; moveFailed?: boolean }) => {
      let castledRookSquare;

      const verboseChessMove = getVerboseSanChessMove(sanMove, chessManager);

      if (!verboseChessMove) {
        const err = new Error("Verbose chess move undefined.");
        handleError(err);
        return err;
      }

      const fromSquare = verboseChessMove.from;
      const toSquare = verboseChessMove.to;
      const promotion = verboseChessMove.promotion;

      if (
        verboseChessMove?.isKingsideCastle() ||
        verboseChessMove?.isQueensideCastle()
      ) {
        castledRookSquare = getCastledRookSquare(
          verboseChessMove.color,
          verboseChessMove?.isKingsideCastle(),
        );
      }
      const fromCastledRookSquare = castledRookSquare?.from;
      const toCastledRookSquare = castledRookSquare?.to;

      let capturedPieceSquare;
      if (verboseChessMove.isEnPassant()) {
        capturedPieceSquare =
          `${verboseChessMove.to[0] + (parseInt(verboseChessMove.to[1]) + (verboseChessMove.color === "w" ? -1 : 1))}` as Square;
      } else if (verboseChessMove.isCapture()) {
        capturedPieceSquare = verboseChessMove.to;
      }

      if (moveFailed && capturedPieceSquare) {
        pokemonManager.getPokemonFromSquare(verboseChessMove.from)!.square =
          null;
        chessManager.remove(verboseChessMove.from);
        chessManager.forceAdvanceTurn();
      } else {
        try {
          chessManager.move(
            { from: fromSquare, to: toSquare, promotion },
            { continueOnCheck: true },
          );
        } catch (err) {
          handleError(err as Error);
          return err as Error;
        }
        pokemonManager.movePokemonToSquare(fromSquare, toSquare);
      }

      if (fromCastledRookSquare && toCastledRookSquare) {
        pokemonManager.movePokemonToSquare(
          fromCastledRookSquare,
          toCastledRookSquare,
        );
      }

      setMostRecentMove({ from: fromSquare, to: toSquare });
      setCurrentPokemonBoard(
        mergeBoardAndPokemonState(chessManager.board(), pokemonManager),
      );
      if (capturedPieceSquare) {
        capturePieceAudio.play();
      } else {
        movePieceAudio.play();
      }
    },
    [
      capturePieceAudio,
      chessManager,
      movePieceAudio,
      pokemonManager,
      handleError,
    ],
  );

  const onPokemonBattleStart = useCallback(
    (
      p1Pokemon: PokemonSet<string>,
      p2Pokemon: PokemonSet<string>,
      attemptedMove: { san: string; color: Color },
    ) => {
      setCurrentPokemonMoveHistory([]);
      setCurrentBattle({
        p1Pokemon,
        p2Pokemon,
        attemptedMove,
        offensivePlayer: chessManager.turn() === "w" ? "p1" : "p2",
      });
      if (gameState.isSkippingAhead) {
        setBattleStarted(true);
      } else {
        // Need to cancel this timeout when skip to current turn is clicked
        battleTimeout.current = setTimeout(() => {
          setBattleStarted(true);
        }, userState.animationSpeedPreference);
      }
    },
    [
      chessManager,
      gameState.isSkippingAhead,
      userState.animationSpeedPreference,
    ],
  );

  const onPokemonBattleOutput = useCallback(
    (parsedChunk: { args: ArgType; kwArgs: KWArgType }) => {
      setCurrentPokemonMoveHistory((curr) => [...curr, parsedChunk]);
    },
    [],
  );

  const onPokemonBattleEnd = useCallback(() => {
    setBattleStarted(false);
    setCurrentPokemonMoveHistory([]);

    if (gameState.isSkippingAhead) {
      setCurrentBattle(null);
    } else {
      battleTimeout.current = setTimeout(() => {
        setCurrentBattle(null);
      }, userState.animationSpeedPreference);
    }
  }, [userState.animationSpeedPreference, gameState.isSkippingAhead]);

  const onWeatherChange = useCallback(
    (squareModifiers: SquareModifier[]) => {
      pokemonManager.setSquareModifiers(squareModifiers);
    },
    [pokemonManager],
  );

  const onGameEnd = useCallback(
    (victor: Color | "", reason: EndGameReason) => {
      modalStateDispatch({
        type: "OPEN_END_GAME_MODAL",
        payload: { modalProps: { victor, reason } },
      });
      dispatch({ type: "END_MATCH" });
    },
    [modalStateDispatch, dispatch],
  );

  const { catchingUp, currentMatchLog } = useBattleHistory({
    matchHistory,
    currentBattle,
    onBan,
    onDraft,
    onMove,
    onPokemonBattleStart,
    onPokemonBattleOutput,
    onPokemonBattleEnd,
    onWeatherChange,
    onGameEnd,
    skipToEndOfSync: gameState.isSkippingAhead,
    matchLogIndex,
    pokemonLogIndex,
  });

  useEffect(() => {
    dispatch({ type: "SET_CATCHING_UP", payload: catchingUp });

    if (!catchingUp && gameState.isSkippingAhead) {
      dispatch({ type: "SET_SKIPPING_AHEAD", payload: false });
    }
  }, [gameState.isSkippingAhead, catchingUp, dispatch]);

  /**
   * Clear out the timeout for starting and ending a battle if we start skipping ahead.
   * This is to prevent unintended side effects while we're not rendering anything.
   */
  useEffect(() => {
    if (gameState.isSkippingAhead && battleTimeout.current) {
      clearTimeout(battleTimeout.current);
    }
  }, [gameState.isSkippingAhead]);

  const validateDraftPick = useCallback(
    (square: Square, draftColor: Color) => {
      if (draftTurnPick !== color || gameState.isSpectator) {
        return false;
      }
      const chessSquare = chessManager.get(square);
      return (
        chessSquare &&
        chessSquare.color === draftColor &&
        chessSquare.type &&
        !pokemonManager.getPokemonFromSquare(square)
      );
    },
    [pokemonManager, chessManager, gameState.isSpectator, color, draftTurnPick],
  );

  const battleSquare = useMemo(() => {
    if (
      currentBattle &&
      (!catchingUp || userState.animationSpeedPreference >= 1000) &&
      !gameState.isSkippingAhead
    ) {
      if (!demoMode) {
        playRandomBattleSong();
      }
    } else {
      if (!demoMode) {
        playRandomGlobalSong();
      }
    }

    if (currentBattle?.attemptedMove.san) {
      const chessMove = getVerboseSanChessMove(
        currentBattle?.attemptedMove.san,
        chessManager,
      );
      if (chessMove) {
        if (chessMove.isEnPassant()) {
          return `${chessMove.to[0] + (parseInt(chessMove.to[1]) + (chessMove.color === "w" ? -1 : 1))}` as Square;
        } else {
          return chessMove.to;
        }
      }
    }
  }, [
    catchingUp,
    chessManager,
    gameState.isSkippingAhead,
    playRandomBattleSong,
    playRandomGlobalSong,
    userState.animationSpeedPreference,
    currentBattle,
    demoMode,
  ]);

  return (
    <div
      style={{
        display: catchingUp && gameState.isSkippingAhead ? "none" : "block",
      }}
    >
      {battleStarted && currentBattle && (
        <PokemonBattleManager
          p1Pokemon={
            color === "w" ? currentBattle.p1Pokemon : currentBattle.p2Pokemon
          }
          p2Pokemon={
            color === "w" ? currentBattle.p2Pokemon : currentBattle.p1Pokemon
          }
          currentPokemonMoveHistory={currentPokemonMoveHistory}
          perspective={color === "w" ? "p1" : "p2"}
          demoMode={demoMode}
        />
      )}
      <div
        style={{
          display: !battleStarted && !isDrafting ? "block" : "none",
        }}
      >
        <ChessManager
          demoMode={demoMode}
          color={color}
          chessManager={chessManager}
          pokemonManager={pokemonManager}
          mostRecentMove={mostRecentMove}
          currentBattle={currentBattle}
          chessMoveHistory={
            currentMatchLog.filter((log) => log.type === "chess") as ChessData[]
          }
          board={currentPokemonBoard}
          battleSquare={battleSquare}
          onError={(err) => {
            handleError(err);
          }}
          onMove={(san) => {
            if (gameState.isSpectator) {
              return;
            }

            requestChessMove(san);
          }}
        />
      </div>
      {isDrafting && (
        <DraftPokemonManager
          draftTurnPick={draftTurnPick}
          chessManager={chessManager}
          pokemonManager={pokemonManager}
          boardState={currentPokemonBoard}
          onDraftPokemon={(sq, pkmnIndex) => {
            if (validateDraftPick(sq, color!)) {
              requestDraftPokemon(sq, pkmnIndex);
              setIsDrafting(!!pokemonManager.draftPieces.length);
            }
          }}
          onBanPokemon={(pkmnIndex) => {
            if (gameState.isSpectator) {
              return;
            }
            requestBanPokemon(pkmnIndex);
          }}
        />
      )}
      {gameState.isCatchingUp && gameState.isSkippingAhead && (
        <div className="skipSpinnerContainer">
          <Spinner />
          Skipping ahead...
        </div>
      )}
    </div>
  );
};
