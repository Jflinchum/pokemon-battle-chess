import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ChessMoveHistory, { ChessMoveHistoryProps } from "../ChessMoveHistory";
import { createMockChessMove } from "../../../../../testUtils/chess";

const defaultMoves = [
  createMockChessMove("w", "e4"),
  createMockChessMove("b", "e5"),
  createMockChessMove("w", "Nf3"),
  createMockChessMove("b", "Nc6"),
];

const setup = (props: Partial<ChessMoveHistoryProps> = {}) => {
  const utils = render(
    <ChessMoveHistory chessMoveHistory={defaultMoves} {...props} />,
  );

  const title = screen.getByTestId("chess-move-history-title");
  const moveHistoryContainer = screen.getByTestId(
    "chess-move-history-container",
  );
  const moveRows = screen.queryAllByTestId("chess-move-history-row");
  const whiteMoves = screen.queryAllByTestId("chess-move-history-white-move");
  const blackMoves = screen.queryAllByTestId("chess-move-history-black-move");
  const turnLabels = screen.queryAllByTestId("chess-move-history-turn-label");

  return {
    title,
    moveRows,
    whiteMoves,
    blackMoves,
    turnLabels,
    moveHistoryContainer,
    ...utils,
  };
};

describe("ChessMoveHistory", () => {
  describe("Empty History", () => {
    it("should render title with empty move list when no moves are provided", () => {
      const { title, moveHistoryContainer, moveRows } = setup({
        chessMoveHistory: [],
      });

      expect(title).toBeInTheDocument();
      expect(moveHistoryContainer).toBeInTheDocument();
      expect(moveRows).toHaveLength(0);
    });
  });

  describe("Move Rendering", () => {
    it("should render a single white move correctly", () => {
      const { moveRows, turnLabels, whiteMoves, blackMoves } = setup({
        chessMoveHistory: [createMockChessMove("w", "e4")],
      });

      expect(moveRows).toHaveLength(1);
      expect(turnLabels[0]).toHaveTextContent("1.");
      expect(whiteMoves[0]).toHaveTextContent("e4");
      expect(blackMoves[0]).toHaveTextContent("");
    });

    it("should render a complete turn (white and black moves) correctly", () => {
      const { moveRows, turnLabels, whiteMoves, blackMoves } = setup({
        chessMoveHistory: [
          createMockChessMove("w", "e4"),
          createMockChessMove("b", "e5"),
        ],
      });

      expect(moveRows).toHaveLength(1);
      expect(turnLabels[0]).toHaveTextContent("1.");
      expect(whiteMoves[0]).toHaveTextContent("e4");
      expect(blackMoves[0]).toHaveTextContent("e5");
    });

    it("should render multiple turns correctly", () => {
      const { turnLabels, moveRows, whiteMoves, blackMoves } = setup();

      expect(moveRows).toHaveLength(2);
      expect(whiteMoves[0]).toHaveTextContent("e4");
      expect(blackMoves[0]).toHaveTextContent("e5");
      expect(whiteMoves[1]).toHaveTextContent("Nf3");
      expect(blackMoves[1]).toHaveTextContent("Nc6");
      expect(turnLabels[1]).toHaveTextContent("2.");
    });

    it("should handle an incomplete last turn (only white move)", () => {
      const { moveRows, whiteMoves, blackMoves } = setup({
        chessMoveHistory: [
          createMockChessMove("w", "e4"),
          createMockChessMove("b", "e5"),
          createMockChessMove("w", "Nf3"),
        ],
      });

      expect(moveRows).toHaveLength(2);
      expect(whiteMoves[1]).toHaveTextContent("Nf3");
      expect(blackMoves[1]).toHaveTextContent("");
    });
  });

  describe("Move Status Styling", () => {
    it("should apply win styling to successful moves", () => {
      const { whiteMoves, blackMoves } = setup({
        chessMoveHistory: [
          createMockChessMove("w", "e4", false),
          createMockChessMove("b", "e5", false),
        ],
      });

      expect(whiteMoves[0]).toHaveClass("moveHistoryWin");
      expect(blackMoves[0]).toHaveClass("moveHistoryWin");
    });

    it("should apply fail styling to failed moves", () => {
      const { whiteMoves, blackMoves } = setup({
        chessMoveHistory: [
          createMockChessMove("w", "e4", true),
          createMockChessMove("b", "e5", true),
        ],
      });

      expect(whiteMoves[0]).toHaveClass("moveHistoryFail");
      expect(blackMoves[0]).toHaveClass("moveHistoryFail");
    });

    it("should not apply win/fail styling to moves without status", () => {
      const { whiteMoves, blackMoves } = setup({
        chessMoveHistory: [
          createMockChessMove("w", "e4"),
          createMockChessMove("b", "e5"),
        ],
      });

      expect(whiteMoves[0]).not.toHaveClass(
        "moveHistoryWin",
        "moveHistoryFail",
      );
      expect(blackMoves[0]).not.toHaveClass(
        "moveHistoryWin",
        "moveHistoryFail",
      );
    });
  });

  describe("Auto-scrolling", () => {
    it("should scroll to bottom when new moves are added", () => {
      const moves = Array.from({ length: 20 }, (_, i) =>
        createMockChessMove(i % 2 === 0 ? "w" : "b", `move${i + 1}`),
      );

      const { moveHistoryContainer: historyContainer, rerender } = setup({
        chessMoveHistory: moves,
      });

      const newMoves = [
        ...moves,
        createMockChessMove("w", "newMove1"),
        createMockChessMove("b", "newMove2"),
      ];

      rerender(<ChessMoveHistory chessMoveHistory={newMoves} />);

      expect(historyContainer.scrollTop).toBe(historyContainer.scrollHeight);
    });
  });
});
