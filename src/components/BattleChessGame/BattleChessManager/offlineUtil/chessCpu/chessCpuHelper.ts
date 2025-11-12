import { Chess, Move } from "chess.js";
import { getVerboseChessMove } from "../../../ChessManager/util";

export const getRandomChessMove = (chessManager: Chess): Move | undefined => {
  const possibleMoves = chessManager.moves({
    verbose: true,
    continueOnCheck: true,
  });
  const randomMove =
    possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  if (!randomMove) {
    console.error("could not find random chess move");
  } else {
    return randomMove;
  }
};

export const getChessMoveIfCpuInCheckmate = (chessManager: Chess) => {
  if (chessManager.isCheckmate()) {
    const randomChessMove = getRandomChessMove(chessManager);
    if (randomChessMove) {
      return randomChessMove;
    } else {
      console.error("No random chess move could be found while in checkmate");
      console.log(chessManager.fen());
    }
  }
};

export const getChessMoveIfCpuInStalemate = (chessManager: Chess) => {
  if (chessManager.isStalemate()) {
    const randomChessMove = getRandomChessMove(chessManager);
    if (randomChessMove) {
      return randomChessMove;
    } else {
      console.error("No random chess move could be found while in stalemate");
      console.log(chessManager.fen());
    }
  }
};

export const getChessMoveIfCpuInDraw = (chessManager: Chess) => {
  if (chessManager.isDraw()) {
    const randomChessMove = getRandomChessMove(chessManager);
    if (randomChessMove) {
      return randomChessMove;
    } else {
      console.error("No random chess move could be found while in draw");
      console.log(chessManager.fen());
    }
  }
};

export const getChessMoveIfOpponentInCheckOrCheckmate = (
  chessManager: Chess,
) => {
  const opponentKingSquare = chessManager.findPiece({
    type: "k",
    color: chessManager.turn() === "w" ? "b" : "w",
  })[0];
  const squaresThatCanAttackOpponentKing = chessManager.attackers(
    opponentKingSquare,
    chessManager.turn(),
  );
  if (squaresThatCanAttackOpponentKing.length) {
    const attackKingMove = getVerboseChessMove(
      squaresThatCanAttackOpponentKing[0],
      opponentKingSquare,
      chessManager,
    );
    if (attackKingMove) {
      return attackKingMove;
    } else {
      console.error(
        "No random chess move could be found while opponent in checkmate",
      );
      console.log(chessManager.fen());
    }
  }
};
