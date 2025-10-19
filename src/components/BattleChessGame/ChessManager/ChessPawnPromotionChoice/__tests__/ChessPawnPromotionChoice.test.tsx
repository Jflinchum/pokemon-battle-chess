import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Color, PieceSymbol, Square } from "chess.js";
import { describe, expect, it, vi } from "vitest";
import { allPieceTypes } from "../../constants";
import ChessPawnPromotionChoice, {
  ChessPawnPromotionChoiceProps,
} from "../ChessPawnPromotionChoice";

const createSquareElement = (square: Square) => {
  const div = document.createElement("div");
  div.id = `chessSquare-${square}`;
  document.body.appendChild(div);
  return div;
};

const setup = (props: Partial<ChessPawnPromotionChoiceProps> = {}) => {
  const onPromotionChoice = vi.fn();
  const onPromotionCancel = vi.fn();

  const utils = render(
    <ChessPawnPromotionChoice
      toSquare="e8"
      color="w"
      onPromotionChoice={onPromotionChoice}
      onPromotionCancel={onPromotionCancel}
      {...props}
    />,
  );

  const menu = screen.queryByTestId("chess-piece-promotion-menu");
  const portalContainer = screen.queryByTestId("chess-piece-promotion-portal");
  const cancelButton = screen.queryByTestId("chess-piece-promotion-cancel");
  const getPromotionChoice = (piece: PieceSymbol) =>
    screen.queryByTestId(`chess-piece-promotion-choice-${piece}`);

  return {
    menu,
    portalContainer,
    cancelButton,
    getPromotionChoice,
    onPromotionChoice,
    onPromotionCancel,
    ...utils,
  };
};

describe("ChessPawnPromotionChoice", () => {
  const validPromotionPieces = allPieceTypes.filter(
    (p) => p !== "p" && p !== "k",
  );

  describe("Rendering", () => {
    it("should render menu directly when target square element is not found", () => {
      const { menu, portalContainer } = setup();

      expect(menu).toBeInTheDocument();
      expect(portalContainer).not.toBeInTheDocument();
    });

    it("should render menu in portal when target square element exists", () => {
      const square = "e8" as Square;
      createSquareElement(square);

      const { menu, portalContainer } = setup({ toSquare: square });

      expect(portalContainer).toBeInTheDocument();
      expect(menu).toBeInTheDocument();
    });

    it("should render all valid promotion pieces", () => {
      const { getPromotionChoice } = setup();

      validPromotionPieces.forEach((piece) => {
        expect(getPromotionChoice(piece)).toBeInTheDocument();
      });
    });

    it("should not render pawn or king as promotion options", () => {
      const { getPromotionChoice } = setup();

      expect(getPromotionChoice("p")).not.toBeInTheDocument();
      expect(getPromotionChoice("k")).not.toBeInTheDocument();
    });

    it("should render cancel button", () => {
      const { cancelButton } = setup();
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe("Event Handlers", () => {
    it.each(validPromotionPieces)(
      "should call onPromotionChoice with %s when clicking its button",
      async (piece) => {
        const { getPromotionChoice, onPromotionChoice } = setup();

        const choiceButton = getPromotionChoice(piece);
        expect(choiceButton).toBeInTheDocument();

        await userEvent.click(choiceButton!);
        expect(onPromotionChoice).toHaveBeenCalledWith(piece);
      },
    );

    it("should call onPromotionCancel when clicking cancel button", async () => {
      const { cancelButton, onPromotionCancel } = setup();

      expect(cancelButton).toBeInTheDocument();

      await userEvent.click(cancelButton!);
      expect(onPromotionCancel).toHaveBeenCalled();
    });
  });

  describe("Color Variations", () => {
    it.each<Color>(["w", "b"])(
      "should render pieces with correct color: %s",
      (color) => {
        const { getPromotionChoice } = setup({ color });

        validPromotionPieces.forEach((piece) => {
          const button = getPromotionChoice(piece);
          expect(button).toBeInTheDocument();
        });
      },
    );
  });
});
