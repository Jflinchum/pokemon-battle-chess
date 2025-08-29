import { Color, Square } from "chess.js";

export const getCastledRookSquare = (
  color: Color,
  isKingsideCastle: boolean,
): { from: Square; to: Square } => {
  return {
    from: `${isKingsideCastle ? "h" : "a"}${color === "w" ? "1" : "8"}`,
    to: `${isKingsideCastle ? "f" : "d"}${color === "w" ? "1" : "8"}`,
  };
};
