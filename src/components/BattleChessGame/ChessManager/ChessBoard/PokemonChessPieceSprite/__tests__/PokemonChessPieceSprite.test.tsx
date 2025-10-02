import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Color, PieceSymbol } from "chess.js";
import * as UserStateContext from "../../../../../../context/UserState/UserStateContext";
import PokemonChessPieceSprite, {
  PokemonChessPieceSpriteProps,
} from "../PokemonChessPieceSprite";
import { getMockPokemonSet } from "../../../../../../testUtils/pokemon";
import { getMockUserStateContext } from "../../../../../../testUtils/userState";

import { Sprites } from "@pkmn/img";

vi.mock("@pkmn/img");

describe("PokemonChessPieceSprite", () => {
  const mockPokemon = getMockPokemonSet();
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (props: Partial<PokemonChessPieceSpriteProps> = {}) => {
    const mockedUserStateContext = getMockUserStateContext();

    vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
      mockedUserStateContext,
    );
    vi.spyOn(Sprites, "getPokemon").mockReturnValue({
      gen: 1,
      w: 128,
      h: 128,
      url: "",
      pixelated: false,
    });
    const utils = render(<PokemonChessPieceSprite {...props} />);

    const pokemonChessPieceContainer = screen.queryByTestId(
      "pokemon-chess-piece-container",
    );
    const chessPieceSprite = screen.queryByTestId("pokemon-chess-piece");
    const pokemonSprite = screen.queryByTestId(
      "pokemon-chess-piece-pokemon-sprite",
    );
    return {
      pokemonChessPieceContainer,
      chessPieceSprite,
      pokemonSprite,
      ...utils,
    };
  };

  describe("Rendering", () => {
    it("should render nothing when type or color is missing", () => {
      let { container } = setup();
      expect(container.firstChild).toBeNull();

      container = setup({ chessPieceType: "p" }).container;
      expect(container.firstChild).toBeNull();

      container = setup({ chessPieceColor: "w" }).container;
      expect(container.firstChild).toBeNull();
    });

    it("should render a chess piece when type and color are provided", () => {
      const { chessPieceSprite } = setup({
        chessPieceType: "p",
        chessPieceColor: "w",
      });

      expect(chessPieceSprite).toBeInTheDocument();
    });

    it("should render pokemon sprite and chess piece when pokemon data is given along with chess piece props", () => {
      const { chessPieceSprite, pokemonSprite } = setup({
        chessPieceType: "p",
        chessPieceColor: "w",
        pokemon: mockPokemon,
      });

      expect(chessPieceSprite).toBeInTheDocument();
      expect(pokemonSprite).toBeInTheDocument();
    });
  });

  describe("Drag Functionality", () => {
    it("should be draggable", () => {
      const { pokemonChessPieceContainer } = setup({
        chessPieceType: "p",
        chessPieceColor: "w",
      });

      expect(pokemonChessPieceContainer).toHaveAttribute("draggable", "true");
    });

    it("should call onDragStart when dragging starts", () => {
      const onDragStart = vi.fn();
      const { pokemonChessPieceContainer } = setup({
        chessPieceType: "p" as PieceSymbol,
        chessPieceColor: "w" as Color,
        onDragStart,
      });

      expect(pokemonChessPieceContainer).toBeInTheDocument();
      fireEvent.dragStart(pokemonChessPieceContainer!);

      expect(onDragStart).toHaveBeenCalled();
    });
  });

  describe("Pokemon Sprite", () => {
    it("should pass correct props to pokemon sprite", () => {
      const pokemon = {
        ...mockPokemon,
        shiny: true,
        gender: "M",
      };

      setup({
        chessPieceType: "p",
        chessPieceColor: "w",
        pokemon,
      });

      expect(Sprites.getPokemon).toHaveBeenCalledWith(pokemon.species, {
        gen: "ani",
        gender: pokemon.gender,
        shiny: pokemon.shiny,
      });
    });
  });

  describe("Chess Sprite", () => {
    it.each([
      ["p", "w", "White Pawn"],
      ["r", "b", "Black Rook"],
      ["n", "w", "White Knight"],
      ["b", "b", "Black Bishop"],
      ["q", "w", "White Queen"],
      ["k", "b", "Black King"],
    ])(
      "should render %s chess piece correctly",
      (type, color, expectedTitle) => {
        const { chessPieceSprite } = setup({
          chessPieceType: type as PieceSymbol,
          chessPieceColor: color as Color,
        });

        expect(chessPieceSprite).toHaveAttribute("alt", expectedTitle);
      },
    );
  });
});
