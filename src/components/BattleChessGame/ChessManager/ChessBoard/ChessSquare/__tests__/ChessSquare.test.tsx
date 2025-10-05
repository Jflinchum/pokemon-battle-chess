import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ChessSquare, { ChessSquareProps } from "../ChessSquare";
import { Color, PieceSymbol, Square } from "chess.js";
import { getMockPokemonSet } from "../../../../../../testUtils/pokemon";
import { getMockUserStateContext } from "../../../../../../testUtils/userState";
import * as UserStateContext from "../../../../../../context/UserState/UserStateContext";
import {
  getMockModifiers,
  getMockSquareModifiers,
} from "../../../../../../testUtils/squareModifiers";

const squareMock = {
  square: "a1" as Square,
  type: "r" as PieceSymbol,
  color: "w" as Color,
  pokemon: getMockPokemonSet(),
  modifiers: getMockModifiers(),
};

const setup = (props: Partial<ChessSquareProps> = {}) => {
  const mockedUserStateContext = getMockUserStateContext();
  vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
    mockedUserStateContext,
  );

  const onClickMock = vi.fn();
  const onSquareHoverMock = vi.fn();
  const onPieceDropMock = vi.fn();
  const onPieceDragMock = vi.fn();
  const utils = render(
    <ChessSquare
      perspective="w"
      square={squareMock}
      squareModifier={getMockSquareModifiers()}
      backgroundColor="white"
      onClick={onClickMock}
      onSquareHover={onSquareHoverMock}
      onPieceDrop={onPieceDropMock}
      onPieceDrag={onPieceDragMock}
      possibleMove={false}
      selected={false}
      mostRecentMove={false}
      isPreMove={false}
      isBattleSquare={false}
      {...props}
    />,
  );
  const chessSquareContainer = screen.getByTestId("chess-square-container");
  const chessSquareColor = screen.getByTestId("chess-square-color");
  const chessSquareWeatherModifiers = screen.queryByTestId(
    "chess-square-weather-modifiers",
  );
  const chessSquareTerrainModifiers = screen.queryByTestId(
    "chess-square-terrain-modifiers",
  );
  const chessSquarePieceSprite = screen.queryByTestId(
    "chess-square-piece-sprite",
  );
  const chessSquareRankLabel = screen.queryByTestId("chess-square-rank-label");
  const chessSquareFileLabel = screen.queryByTestId("chess-square-file-label");
  const chessSquarePokemonChessPiece = screen.queryByTestId(
    "pokemon-chess-piece-container",
  );
  const chessSquarePokemonChessPieceChessSprite = screen.queryByTestId(
    "pokemon-chess-piece",
  );
  const chessSquarePokemonChessPiecePokemonSprite = screen.queryByTestId(
    "pokemon-chess-piece-pokemon-sprite",
  );

  return {
    chessSquareContainer,
    chessSquareColor,
    chessSquareWeatherModifiers,
    chessSquareTerrainModifiers,
    chessSquarePieceSprite,
    chessSquareRankLabel,
    chessSquareFileLabel,
    chessSquarePokemonChessPiece,
    chessSquarePokemonChessPieceChessSprite,
    chessSquarePokemonChessPiecePokemonSprite,
    onClickMock,
    onSquareHoverMock,
    onPieceDropMock,
    onPieceDragMock,
    ...utils,
  };
};

describe("ChessSquare", () => {
  describe("Event Handlers", () => {
    it("should trigger onSquareHover with the square value when the user hovers over the square", async () => {
      const { chessSquareContainer, onSquareHoverMock } = setup();
      expect(onSquareHoverMock).not.toHaveBeenCalled();
      await userEvent.hover(chessSquareContainer);
      expect(onSquareHoverMock).toHaveBeenCalledExactlyOnceWith(squareMock);
    });

    it("should trigger onSquareHover with null when the user unhovers over the square", async () => {
      const { chessSquareContainer, onSquareHoverMock } = setup();
      expect(onSquareHoverMock).not.toHaveBeenCalled();
      await userEvent.unhover(chessSquareContainer);
      expect(onSquareHoverMock).toHaveBeenCalledExactlyOnceWith(null);
    });

    it("should trigger onClick when the user clicks the square", async () => {
      const { chessSquareContainer, onClickMock } = setup();
      expect(onClickMock).not.toHaveBeenCalled();
      await userEvent.click(chessSquareContainer);
      expect(onClickMock).toHaveBeenCalledExactlyOnceWith(squareMock);
    });

    it("should trigger onPieceDrop when the user drags and drops over the square", () => {
      const { chessSquareContainer, onPieceDropMock } = setup();
      expect(onPieceDropMock).not.toHaveBeenCalled();
      fireEvent.drop(chessSquareContainer);
      expect(onPieceDropMock).toHaveBeenCalledExactlyOnceWith(squareMock);
    });

    it("should trigger onPieceDrag when the user drags the Pokemon Chess Piece within the square", () => {
      const { chessSquarePokemonChessPiece, onPieceDragMock } = setup();
      expect(onPieceDragMock).not.toHaveBeenCalled();
      expect(chessSquarePokemonChessPiece).toBeInTheDocument();
      fireEvent.dragStart(chessSquarePokemonChessPiece!);
      expect(onPieceDragMock).toHaveBeenCalledExactlyOnceWith(squareMock);
    });
  });

  describe("Weather and Terrain Modifiers", () => {
    it("should not render a weather or terrain modifier when given none in the square prop", () => {
      const { chessSquareWeatherModifiers, chessSquareTerrainModifiers } =
        setup({
          squareModifier: undefined,
        });
      expect(chessSquareWeatherModifiers).not.toBeInTheDocument();
      expect(chessSquareTerrainModifiers).not.toBeInTheDocument();
    });

    it("should render a weather modifier when given one in the square prop", () => {
      const { chessSquareWeatherModifiers, chessSquareTerrainModifiers } =
        setup({
          squareModifier: getMockSquareModifiers({
            modifiers: getMockModifiers({ terrain: undefined }),
          }),
        });
      expect(chessSquareWeatherModifiers).toBeInTheDocument();
      expect(chessSquareTerrainModifiers).not.toBeInTheDocument();
    });

    it("should render a terrain modifier when given one in the square prop", () => {
      const { chessSquareWeatherModifiers, chessSquareTerrainModifiers } =
        setup({
          squareModifier: getMockSquareModifiers({
            modifiers: getMockModifiers({ weather: undefined }),
          }),
        });
      expect(chessSquareWeatherModifiers).not.toBeInTheDocument();
      expect(chessSquareTerrainModifiers).toBeInTheDocument();
    });

    it("should render both terrain and weather modifiers when given both in the square prop", () => {
      const { chessSquareWeatherModifiers, chessSquareTerrainModifiers } =
        setup();
      expect(chessSquareWeatherModifiers).toBeInTheDocument();
      expect(chessSquareTerrainModifiers).toBeInTheDocument();
    });
  });

  describe("Square Background Color", () => {
    it("should style the chess square as white under normal circumstances on a white square", () => {
      const { chessSquareContainer } = setup({ backgroundColor: "white" });
      expect(chessSquareContainer).toHaveClass("whiteChessSquare");
    });

    it("should style the chess square as black under normal circumstances on a black square", () => {
      const { chessSquareContainer } = setup({ backgroundColor: "black" });
      expect(chessSquareContainer).toHaveClass("blackChessSquare");
    });

    it("should style the chess square as selected if the square is selected", () => {
      const { chessSquareColor } = setup({
        selected: true,
        isBattleSquare: true,
        possibleMove: true,
        isPreMove: true,
        mostRecentMove: true,
      });
      expect(chessSquareColor).toHaveClass("selected");
    });

    it("should style the chess square as a battle square if the square is a battle square", () => {
      const { chessSquareColor } = setup({
        selected: false,
        isBattleSquare: true,
        possibleMove: true,
        isPreMove: true,
        mostRecentMove: true,
      });
      expect(chessSquareColor).toHaveClass("battleSquare");
    });

    it("should style the chess square as highlighted if the square is a possible move", () => {
      const { chessSquareColor } = setup({
        selected: false,
        isBattleSquare: false,
        possibleMove: true,
        isPreMove: true,
        mostRecentMove: true,
      });
      expect(chessSquareColor).toHaveClass("highlighted");
    });

    it("should style the chess square as a premove if the square is a premove", () => {
      const { chessSquareColor } = setup({
        selected: false,
        isBattleSquare: false,
        possibleMove: false,
        isPreMove: true,
        mostRecentMove: true,
      });
      expect(chessSquareColor).toHaveClass("premove");
    });

    it("should style the chess square as a most recent move if the square was the most recent move", () => {
      const { chessSquareColor } = setup({
        selected: false,
        isBattleSquare: false,
        possibleMove: false,
        isPreMove: false,
        mostRecentMove: true,
      });
      expect(chessSquareColor).toHaveClass("mostRecentMove");
    });
  });

  describe("Rank and File Labels", () => {
    it.each([
      ["a", "1"],
      ["b", "1"],
      ["c", "1"],
      ["d", "1"],
      ["e", "1"],
      ["f", "1"],
      ["g", "1"],
      ["h", "1"],
    ])(
      "should render %s file label correctly for white perspective",
      (rank, file) => {
        const { chessSquareFileLabel } = setup({
          square: {
            square: `${rank}${file}` as Square,
          },
        });
        expect(chessSquareFileLabel).toBeInTheDocument();
        expect(chessSquareFileLabel).toHaveTextContent(rank);
      },
    );

    it.each([
      ["a", "1"],
      ["a", "2"],
      ["a", "3"],
      ["a", "4"],
      ["a", "5"],
      ["a", "6"],
      ["a", "7"],
      ["a", "8"],
    ])(
      "should render %s rank label correctly for black perspective",
      (rank, file) => {
        const { chessSquareRankLabel } = setup({
          square: {
            square: `${rank}${file}` as Square,
          },
        });
        expect(chessSquareRankLabel).toBeInTheDocument();
        expect(chessSquareRankLabel).toHaveTextContent(file);
      },
    );

    it.each([
      ["a", "8"],
      ["b", "8"],
      ["c", "8"],
      ["d", "8"],
      ["e", "8"],
      ["f", "8"],
      ["g", "8"],
      ["h", "8"],
    ])(
      "should render %s file label correctly for black perspective",
      (rank, file) => {
        const { chessSquareFileLabel } = setup({
          square: {
            square: `${rank}${file}` as Square,
          },
          perspective: "b",
        });
        expect(chessSquareFileLabel).toBeInTheDocument();
        expect(chessSquareFileLabel).toHaveTextContent(rank);
      },
    );

    it.each([
      ["h", "1"],
      ["h", "2"],
      ["h", "3"],
      ["h", "4"],
      ["h", "5"],
      ["h", "6"],
      ["h", "7"],
      ["h", "8"],
    ])(
      "should render %s rank label correctly for black perspective",
      (rank, file) => {
        const { chessSquareRankLabel } = setup({
          square: {
            square: `${rank}${file}` as Square,
          },
          perspective: "b",
        });
        expect(chessSquareRankLabel).toBeInTheDocument();
        expect(chessSquareRankLabel).toHaveTextContent(file);
      },
    );
  });

  describe("Chess Piece Rendering", () => {
    it("should a Pokemon Chess Piece when given a chess piece and pokemon", () => {
      const {
        chessSquarePokemonChessPiece,
        chessSquarePokemonChessPieceChessSprite,
        chessSquarePokemonChessPiecePokemonSprite,
      } = setup();
      expect(chessSquarePokemonChessPiece).toBeInTheDocument();
      expect(chessSquarePokemonChessPieceChessSprite).toBeInTheDocument();
      expect(chessSquarePokemonChessPiecePokemonSprite).toBeInTheDocument();
    });

    it("should a only render a Chess Piece when given a chess piece and no pokemon", () => {
      const {
        chessSquarePokemonChessPiece,
        chessSquarePokemonChessPieceChessSprite,
        chessSquarePokemonChessPiecePokemonSprite,
      } = setup({
        square: {
          square: "a1",
          type: "r",
          color: "w",
        },
      });
      expect(chessSquarePokemonChessPiece).toBeInTheDocument();
      expect(chessSquarePokemonChessPieceChessSprite).toBeInTheDocument();
      expect(chessSquarePokemonChessPiecePokemonSprite).not.toBeInTheDocument();
    });

    it("should not render a Pokemon Chess Piece when not given a chess piece", () => {
      const {
        chessSquarePokemonChessPiece,
        chessSquarePokemonChessPieceChessSprite,
        chessSquarePokemonChessPiecePokemonSprite,
      } = setup({
        square: {
          square: "a1",
        },
      });
      expect(chessSquarePokemonChessPiece).not.toBeInTheDocument();
      expect(chessSquarePokemonChessPieceChessSprite).not.toBeInTheDocument();
      expect(chessSquarePokemonChessPiecePokemonSprite).not.toBeInTheDocument();
    });
  });
});
