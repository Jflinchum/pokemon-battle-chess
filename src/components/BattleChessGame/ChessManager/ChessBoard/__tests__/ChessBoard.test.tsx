import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Color, Square } from "chess.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as UserStateContext from "../../../../../context/UserState/UserStateContext";
import {
  createEmptyBoard,
  createMockPokemonChessBoardSquare,
} from "../../../../../testUtils/chess";
import { getMockSquareModifiers } from "../../../../../testUtils/squareModifiers";
import { getMockUserStateContext } from "../../../../../testUtils/userState";
import ChessBoard, { ChessBoardProps } from "../ChessBoard";

const mockBoard = createEmptyBoard();
// Adding some pieces for testing
mockBoard[0][0] = createMockPokemonChessBoardSquare("a8" as Square, {
  type: "r",
  color: "b",
});
mockBoard[7][0] = createMockPokemonChessBoardSquare("a1" as Square, {
  type: "r",
  color: "w",
});

const setup = (overrides: Partial<ChessBoardProps> = {}) => {
  const mockedUserStateContext = getMockUserStateContext();
  vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
    mockedUserStateContext,
  );

  const onSquareClickMock = vi.fn();
  const onSquareHoverMock = vi.fn();
  const onPieceDropMock = vi.fn();
  const onPieceDragMock = vi.fn();
  const utils = render(
    <ChessBoard
      color={"w" as Color}
      boardState={mockBoard}
      onSquareClick={onSquareClickMock}
      onSquareHover={onSquareHoverMock}
      onPieceDrag={onPieceDragMock}
      onPieceDrop={onPieceDropMock}
      highlightedSquares={[]}
      selectedSquare={null}
      squareModifiers={[getMockSquareModifiers()]}
      {...overrides}
    />,
  );

  const squares = screen.getAllByTestId("chess-square-container");
  const squareColors = screen.getAllByTestId("chess-square-color");

  return {
    squares,
    squareColors,
    onSquareClickMock,
    onSquareHoverMock,
    onPieceDropMock,
    onPieceDragMock,
    ...utils,
  };
};

describe("ChessBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Board Rendering", () => {
    it("should render 64 squares in correct order for white perspective", () => {
      const { squares } = setup();
      expect(squares).toHaveLength(64);

      const firstRow = squares.slice(0, 8);
      expect(firstRow[0]).toHaveAttribute("id", "chessSquare-a8");
      expect(firstRow[7]).toHaveAttribute("id", "chessSquare-h8");

      const lastRow = squares.slice(-8);
      expect(lastRow[0]).toHaveAttribute("id", "chessSquare-a1");
      expect(lastRow[7]).toHaveAttribute("id", "chessSquare-h1");
    });

    it("should render 64 squares in correct order for black perspective", () => {
      const { squares } = setup({ color: "b" });
      expect(squares).toHaveLength(64);

      const firstRow = squares.slice(0, 8);
      expect(firstRow[0]).toHaveAttribute("id", "chessSquare-h1");
      expect(firstRow[7]).toHaveAttribute("id", "chessSquare-a1");

      const lastRow = squares.slice(-8);
      expect(lastRow[0]).toHaveAttribute("id", "chessSquare-h8");
      expect(lastRow[7]).toHaveAttribute("id", "chessSquare-a8");
    });

    it("should pass square modifiers to the correct squares", () => {
      const squareModifiers = [
        getMockSquareModifiers(
          { square: "e4" as Square },
          { terrain: undefined },
        ),
        getMockSquareModifiers(
          { square: "d5" as Square },
          { weather: undefined },
        ),
      ];

      setup({ squareModifiers });

      const e4Square = screen.getByTestId("chess-square-weather-modifiers");
      const e4Container = e4Square.closest('[id="chessSquare-e4"]');
      expect(e4Container).toBeInTheDocument();

      const d5Square = screen.getByTestId("chess-square-terrain-modifiers");
      const d5Container = d5Square.closest('[id="chessSquare-d5"]');
      expect(d5Container).toBeInTheDocument();
    });
  });

  describe("Square Highlighting", () => {
    it("should highlight the selected square", () => {
      const { container } = setup({ selectedSquare: "e4" });
      const selectedSquare = container.querySelector('[id="chessSquare-e4"]');
      const selectedSquareColor = selectedSquare?.querySelector(
        '[data-testid="chess-square-color"]',
      );
      expect(selectedSquare).toBeInTheDocument();
      expect(selectedSquareColor).toHaveClass("selected");
    });

    it("should highlight possible moves", () => {
      const { squareColors } = setup({ highlightedSquares: ["e4", "e5"] });
      const highlightedSquares = squareColors.filter((squareColors) =>
        squareColors.classList.contains("highlighted"),
      );
      expect(highlightedSquares).toHaveLength(2);
    });

    it("should highlight the most recent move squares", () => {
      const { squareColors } = setup({
        mostRecentMove: { from: "e2", to: "e4" },
      });
      const recentMoveSquares = squareColors.filter((squareColors) =>
        squareColors.classList.contains("mostRecentMove"),
      );
      expect(recentMoveSquares).toHaveLength(2);
    });

    it("should highlight premove squares", () => {
      const { squareColors } = setup({
        preMoveQueue: [{ from: "e2", to: "e4" }],
      });
      const premoveSquares = squareColors.filter((squareColor) =>
        squareColor.classList.contains("premove"),
      );
      expect(premoveSquares).toHaveLength(2);
    });

    it("should highlight battle square", () => {
      const { squareColors } = setup({ battleSquare: "e4" });
      const battleSquares = squareColors.filter((squareColor) =>
        squareColor.classList.contains("battleSquare"),
      );
      expect(battleSquares).toHaveLength(1);
    });
  });

  describe("Event Handlers", () => {
    it("should trigger onSquareClick when a square is clicked", () => {
      const { squares, onSquareClickMock } = setup();
      const square = squares[0];
      square.click();
      expect(onSquareClickMock).toHaveBeenCalledWith(
        expect.objectContaining({
          square: "a8",
        }),
      );
    });

    it("should trigger onSquareHover when hovering over a square", async () => {
      const { squares, onSquareHoverMock } = setup();
      await userEvent.hover(squares[0]);
      expect(onSquareHoverMock).toHaveBeenCalledWith(
        expect.objectContaining({
          square: "a8",
        }),
      );
    });

    it("should trigger onPieceDrag when dragging a piece", () => {
      const { onPieceDragMock } = setup();
      const piece = screen.getAllByTestId("pokemon-chess-piece-container")[0];
      piece.dispatchEvent(new MouseEvent("dragstart", { bubbles: true }));
      expect(onPieceDragMock).toHaveBeenCalledWith(
        expect.objectContaining({
          square: "a8",
        }),
      );
    });

    it("should trigger onPieceDrop when dropping a piece", () => {
      const { squares, onPieceDropMock } = setup();
      const square = squares[0];
      square.dispatchEvent(new MouseEvent("drop", { bubbles: true }));
      expect(onPieceDropMock).toHaveBeenCalledWith(
        expect.objectContaining({
          square: "a8",
        }),
      );
    });
  });
});
