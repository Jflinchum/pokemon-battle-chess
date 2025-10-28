import { PokemonSet } from "@pkmn/data";
import { ArgType, KWArgType } from "@pkmn/protocol";
import { PRNG } from "@pkmn/sim";
import { Chess, Color, Square } from "chess.js";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  PokemonBattleChessManager,
  SquareModifier,
} from "../../../../shared/models/PokemonBattleChessManager";
import {
  ChessData,
  EndGameReason,
  MatchHistory,
} from "../../../../shared/types/Game.js";
import { getCastledRookSquare } from "../../../../shared/util/getCastledRookSquare";
import capturePieceFX from "../../../assets/chessAssets/audio/capturePiece.ogg";
import movePieceFX from "../../../assets/chessAssets/audio/movePiece.ogg";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { useModalState } from "../../../context/ModalState/ModalStateContext";
import { useUserState } from "../../../context/UserState/UserStateContext";
import { useMusicPlayer } from "../../../util/useMusicPlayer";
import { useSocketRequests } from "../../../util/useSocketRequests";
import Spinner from "../../common/Spinner/Spinner";
import ChessManager from "../ChessManager/ChessManager";
import {
  getVerboseSanChessMove,
  mergeBoardAndPokemonState,
} from "../ChessManager/util";
import DraftPokemonManager from "../DraftPokemonManager/DraftPokemonManager";
import PokemonBattleManager from "../PokemonManager/PokemonBattleManager/PokemonBattleManager";
import { CurrentBattle } from "./BattleChessManager";
import useBattleHistory from "./useBattleHistory";
import { usePremoves } from "./usePremove";

export const BattleChessGame = ({
  matchHistory,
  chessManager,
  pokemonManager,
  demoMode,
  color,
  matchLogIndex,
  draftMode,
}: {
  matchHistory?: MatchHistory;
  pokemonManager: PokemonBattleChessManager;
  chessManager: Chess;
  demoMode?: boolean;
  draftMode?: boolean;
  color: Color;
  matchLogIndex: RefObject<number>;
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
  const [mostRecentChessMove, setMostRecentChessMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [mostRecentRequestedChessMove, setMostRecentRequestedChessMove] =
    useState("");
  const [currentPokemonMoveHistory, setCurrentPokemonMoveHistory] = useState<
    { args: ArgType; kwArgs: KWArgType }[]
  >([]);
  const [currentSquareModifiers, setCurrentSquareModifiers] = useState<
    SquareModifier[]
  >(pokemonManager.squareModifiers);
  const prng = useMemo(
    () => new PRNG(gameState.gameSettings.seed || "1234,1234"),
    [gameState.gameSettings.seed],
  );
  const errorRecoveryAttempts = useRef(0);

  const { movePieceAudio, capturePieceAudio } = useMemo(() => {
    const movePieceAudio = new Audio(movePieceFX);
    const capturePieceAudio = new Audio(capturePieceFX);
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

  const {
    preMoveQueue,
    setPreMoveQueue,
    resetSimulators,
    simulatedChessManager,
    simulatedPokemonManager,
    simulateMove,
    simulatedBoard,
    validatePremoveQueue,
  } = usePremoves(chessManager, pokemonManager);

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

      if (!pokemonManager.draftPieces.length) {
        // Once we're done draft picking, reset all simulator state and merge the pokemon manager into the board
        resetSimulators();
      }
    },
    [chessManager, pokemonManager, resetSimulators],
  );

  const resetMatchHistory = useCallback(() => {
    matchLogIndex.current = 0;
    dispatch({ type: "SET_SKIPPING_AHEAD", payload: true });
    requestSync();
  }, [dispatch, requestSync, matchLogIndex]);

  const arrows = useMemo(() => {
    const finalArrows = [];

    if (mostRecentChessMove) {
      finalArrows.push({
        from: mostRecentChessMove.from,
        to: mostRecentChessMove.to,
        type: "default" as const,
      });
    }

    if (currentBattle) {
      const battleChessMove = getVerboseSanChessMove(
        currentBattle.attemptedMove.san,
        chessManager,
      );
      if (battleChessMove) {
        finalArrows.push({
          from: battleChessMove.from,
          to: battleChessMove.to,
          type: "battle" as const,
        });
      }
    }
    return finalArrows;
  }, [mostRecentChessMove, currentBattle, chessManager]);

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

  const handleOnMove = async (san: string) => {
    if (chessManager.turn() !== color) {
      if (userState.enablePremoving) {
        const verboseChessMove = getVerboseSanChessMove(
          san,
          simulatedChessManager,
        );
        if (verboseChessMove) {
          simulateMove(verboseChessMove);
        }
      }
    } else {
      try {
        const verboseChessMove = getVerboseSanChessMove(
          san,
          simulatedChessManager,
        );
        if (!verboseChessMove) {
          toast("Error: Invalid chess move.");
          return;
        }
        if (verboseChessMove.isEnPassant() || verboseChessMove.isCapture()) {
          setMostRecentChessMove({
            from: verboseChessMove.from,
            to: verboseChessMove.to,
          });
          await requestChessMove(san);
        } else {
          const err = onMove({ sanMove: san });
          if (!err) {
            setMostRecentRequestedChessMove(san);
            await requestChessMove(san);
          }
        }
      } catch (err) {
        handleError(err as unknown as Error);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPreMoveQueue([]);
    resetSimulators();
  };

  const requestChessMoveWithErrorHandling = useCallback(
    async (san: string) => {
      try {
        await requestChessMove(san);
      } catch (err) {
        handleError(err as unknown as Error);
      }
    },
    [requestChessMove, handleError],
  );

  const onMove = useCallback(
    ({
      sanMove,
      moveFailed,
      shouldValidatePremoveQueue = true,
    }: {
      sanMove: string;
      moveFailed?: boolean;
      shouldValidatePremoveQueue?: boolean;
    }) => {
      if (
        sanMove === mostRecentRequestedChessMove &&
        chessManager.turn() !== color
      ) {
        return;
      }
      const verboseChessMove = getVerboseSanChessMove(sanMove, chessManager);

      if (!verboseChessMove) {
        const err = new Error("Verbose chess move undefined.");
        handleError(err);
        return err;
      }

      let castledRookSquare;
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

      setMostRecentChessMove({ from: fromSquare, to: toSquare });
      setCurrentPokemonBoard(
        mergeBoardAndPokemonState(chessManager.board(), pokemonManager),
      );
      if (shouldValidatePremoveQueue && validatePremoveQueue()) {
        if (chessManager.turn() === color && preMoveQueue.length > 0) {
          const preMoveSan = preMoveQueue[0].san;
          const verbosePremove = getVerboseSanChessMove(
            preMoveSan,
            chessManager,
          );
          if (verbosePremove) {
            if (verbosePremove.isEnPassant() || verbosePremove.isCapture()) {
              setMostRecentChessMove({
                from: verbosePremove.from,
                to: verbosePremove.to,
              });
              requestChessMoveWithErrorHandling(preMoveSan);
            } else {
              const err = onMove({
                sanMove: preMoveSan,
                shouldValidatePremoveQueue: false,
              });
              if (!err) {
                setPreMoveQueue((curr) => curr.slice(1, preMoveQueue.length));
                setMostRecentRequestedChessMove(preMoveSan);
                requestChessMoveWithErrorHandling(preMoveSan);
              }
            }
          }
        }
      }
      if (capturedPieceSquare) {
        capturePieceAudio.play();
      } else {
        movePieceAudio.play();
      }
    },
    [
      mostRecentRequestedChessMove,
      capturePieceAudio,
      chessManager,
      color,
      movePieceAudio,
      pokemonManager,
      handleError,
      validatePremoveQueue,
      preMoveQueue,
      setPreMoveQueue,
      requestChessMoveWithErrorHandling,
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
        setTimeout(() => {
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

  const onWeatherChange = useCallback(
    (squareModifiers: SquareModifier[]) => {
      pokemonManager.updateSquareModifiers(squareModifiers);
      setCurrentSquareModifiers(pokemonManager.squareModifiers);
    },
    [pokemonManager],
  );

  const onWeatherRemove = useCallback(
    (squares: Square[]) => {
      pokemonManager.removeSquareModifiers(squares);
      setCurrentSquareModifiers(pokemonManager.squareModifiers);
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

  const { currentMatchLog } = useBattleHistory({
    matchHistory,
    currentBattle,
    onBan,
    onDraft,
    onMove,
    onPokemonBattleStart,
    onPokemonBattleOutput,
    onWeatherChange,
    onWeatherRemove,
    onGameEnd,
    skipToEndOfSync: gameState.isSkippingAhead,
    matchLogIndex,
  });

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
      (!gameState.isCatchingUp || userState.animationSpeedPreference >= 1000) &&
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
    chessManager,
    gameState.isSkippingAhead,
    gameState.isCatchingUp,
    playRandomBattleSong,
    playRandomGlobalSong,
    userState.animationSpeedPreference,
    currentBattle,
    demoMode,
  ]);

  return (
    <>
      <div
        style={{
          display: gameState.isSkippingAhead ? "none" : "block",
        }}
        onContextMenu={handleContextMenu}
      >
        {battleStarted && currentBattle && (
          <PokemonBattleManager
            prng={prng}
            p1PokemonSet={
              color === "w" ? currentBattle.p1Pokemon : currentBattle.p2Pokemon
            }
            p2PokemonSet={
              color === "w" ? currentBattle.p2Pokemon : currentBattle.p1Pokemon
            }
            currentPokemonMoveHistory={currentPokemonMoveHistory}
            perspective={color === "w" ? "p1" : "p2"}
            demoMode={demoMode}
            onBattleEnd={() => {
              setBattleStarted(false);
              setCurrentPokemonMoveHistory([]);

              if (gameState.isSkippingAhead) {
                setCurrentBattle(null);
              } else {
                setTimeout(() => {
                  setCurrentBattle(null);
                }, userState.animationSpeedPreference);
              }
            }}
          />
        )}
        {!demoMode && !battleStarted && !isDrafting && (
          <div className="turnNotification">
            {chessManager.turn() === color ? (
              <strong className="highPriorityNotification">
                Your turn to move!
              </strong>
            ) : (
              <strong>Waiting for opponent...</strong>
            )}
          </div>
        )}
        <ChessManager
          arrows={arrows}
          hide={battleStarted || isDrafting}
          color={color}
          chessManager={simulatedChessManager}
          pokemonManager={simulatedPokemonManager}
          mostRecentMove={mostRecentChessMove}
          preMoveQueue={preMoveQueue}
          chessMoveHistory={
            currentMatchLog.filter((log) => log.type === "chess") as ChessData[]
          }
          board={simulatedBoard}
          squareModifiers={currentSquareModifiers}
          battleSquare={battleSquare}
          onMove={(san) => {
            if (gameState.isSpectator) {
              return;
            }

            handleOnMove(san);
          }}
        />
        {isDrafting && (
          <DraftPokemonManager
            draftTurnPick={draftTurnPick}
            chessManager={chessManager}
            pokemonManager={pokemonManager}
            boardState={currentPokemonBoard}
            onDraftPokemon={async (sq, pkmnIndex) => {
              if (validateDraftPick(sq, color!)) {
                try {
                  await requestDraftPokemon(sq, pkmnIndex);
                  setIsDrafting(!!pokemonManager.draftPieces.length);
                } catch (err) {
                  toast(`Error: ${err}`, { type: "error" });
                }
              }
            }}
            onBanPokemon={async (pkmnIndex) => {
              if (gameState.isSpectator) {
                return;
              }
              try {
                await requestBanPokemon(pkmnIndex);
              } catch (err) {
                toast(`Error: ${err}`, { type: "error" });
              }
            }}
          />
        )}
      </div>
      {gameState.isSkippingAhead && (
        <div className="skipSpinnerContainer">
          <Spinner />
          Skipping ahead...
        </div>
      )}
    </>
  );
};
