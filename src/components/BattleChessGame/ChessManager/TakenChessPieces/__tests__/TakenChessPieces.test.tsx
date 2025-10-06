import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TakenChessPieces, { TakenChessPiecesProps } from "../TakenChessPieces";
import { Color, PieceSymbol } from "chess.js";
import { createMockPokemonPieces } from "../../../../../testUtils/chess";
import * as UserStateContext from "../../../../../context/UserState/UserStateContext";
import { getMockUserStateContext } from "../../../../../testUtils/userState";

const setup = (props: Partial<TakenChessPiecesProps> = {}) => {
  vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
    getMockUserStateContext(),
  );

  const defaultPieces = [
    { type: "p" as PieceSymbol, color: "w" as Color },
    { type: "b" as PieceSymbol, color: "w" as Color },
  ];

  const utils = render(
    <TakenChessPieces
      takenPieces={props.takenPieces || createMockPokemonPieces(defaultPieces)}
    />,
  );

  const pieceContainer = screen.getByTestId("taken-pieces-container");
  const getTakenPiece = (type: PieceSymbol) =>
    screen.queryByTestId(`taken-piece-${type}`);
  const getAllTakenPieces = () => screen.queryAllByTestId(/^taken-piece-/);

  return {
    pieceContainer,
    getTakenPiece,
    getAllTakenPieces,
    ...utils,
  };
};

describe("TakenChessPieces", () => {
  describe("Container Rendering", () => {
    it("should render the container even with no pieces", () => {
      const { pieceContainer } = setup({ takenPieces: [] });
      expect(pieceContainer).toBeInTheDocument();
      expect(pieceContainer).toHaveClass("takenChessPiecesContainer");
    });
  });

  describe("Piece Rendering", () => {
    it("should render default pieces correctly", () => {
      const { getTakenPiece, getAllTakenPieces } = setup();

      const whitePawn = getTakenPiece("p");
      const blackBishop = getTakenPiece("b");

      expect(whitePawn).toBeInTheDocument();
      expect(blackBishop).toBeInTheDocument();
      expect(getAllTakenPieces()).toHaveLength(2);
    });

    it("should render multiple pieces of the same type", () => {
      const pieces = [
        { type: "p" as PieceSymbol, color: "w" as Color },
        { type: "p" as PieceSymbol, color: "w" as Color },
        { type: "p" as PieceSymbol, color: "b" as Color },
      ];

      const { getAllTakenPieces } = setup({
        takenPieces: createMockPokemonPieces(pieces),
      });

      expect(getAllTakenPieces()).toHaveLength(3);
    });

    it("should render the pieces in order", () => {
      const pieces = [
        { type: "q" as PieceSymbol, color: "w" as Color },
        { type: "r" as PieceSymbol, color: "b" as Color },
        { type: "b" as PieceSymbol, color: "w" as Color },
      ];

      const { getAllTakenPieces } = setup({
        takenPieces: createMockPokemonPieces(pieces),
      });

      const renderedPieces = getAllTakenPieces();
      expect(renderedPieces[0]).toHaveAttribute("data-testid", "taken-piece-q");
      expect(renderedPieces[1]).toHaveAttribute("data-testid", "taken-piece-r");
      expect(renderedPieces[2]).toHaveAttribute("data-testid", "taken-piece-b");
    });
  });
});
