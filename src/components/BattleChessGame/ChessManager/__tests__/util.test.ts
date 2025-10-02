import { describe, expect, it } from "vitest";
import {
  getCastlingSquareFromCornerSquares,
  userAttemptingCastle,
} from "../util";
import { getAllChessBoardSquares } from "../../../../testUtils/chess";
import { Square } from "chess.js";

describe("util.it.ts", () => {
  describe("userAttemptingToCastle", () => {
    it("should return true when given a white king and white rook", () => {
      expect(
        userAttemptingCastle(
          { type: "k", color: "w" },
          { type: "r", color: "w" },
        ),
      ).toBe(true);
    });

    it("should return true when given a black king and black rook", () => {
      expect(
        userAttemptingCastle(
          { type: "k", color: "b" },
          { type: "r", color: "b" },
        ),
      ).toBe(true);
    });

    it("should return false when given a white king and black rook", () => {
      expect(
        userAttemptingCastle(
          { type: "k", color: "w" },
          { type: "r", color: "b" },
        ),
      ).toBe(false);
    });

    it("should return false when given a black king and white rook", () => {
      expect(
        userAttemptingCastle(
          { type: "k", color: "b" },
          { type: "r", color: "w" },
        ),
      ).toBe(false);
    });

    it("should return false when given a non-king piece and rook", () => {
      expect(
        userAttemptingCastle(
          { type: "b", color: "b" },
          { type: "r", color: "b" },
        ),
      ).toBe(false);
    });

    it("should return false when given a king and non-rook piece", () => {
      expect(
        userAttemptingCastle(
          { type: "k", color: "b" },
          { type: "p", color: "b" },
        ),
      ).toBe(false);
    });
  });

  describe("getCastlingSquareFromCornerSquares", () => {
    it("should return c8 when given a8", () => {
      expect(getCastlingSquareFromCornerSquares("a8")).toBe("c8");
    });
    it("should return c1 when given a1", () => {
      expect(getCastlingSquareFromCornerSquares("a1")).toBe("c1");
    });
    it("should return g8 when given h8", () => {
      expect(getCastlingSquareFromCornerSquares("h8")).toBe("g8");
    });
    it("should return g1 when given h1", () => {
      expect(getCastlingSquareFromCornerSquares("h1")).toBe("g1");
    });

    const chessBoardSquares = getAllChessBoardSquares(["a1", "a8", "h1", "h8"]);

    it.each(chessBoardSquares)("should return undefined for $0", (square) => {
      expect(getCastlingSquareFromCornerSquares(square as Square)).toBe(
        undefined,
      );
    });
  });
});
