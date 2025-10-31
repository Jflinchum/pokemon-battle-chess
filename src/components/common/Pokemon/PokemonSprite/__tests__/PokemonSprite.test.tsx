import { Sprites } from "@pkmn/img";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as UserStateContext from "../../../../../context/UserState/UserStateContext";
import { getMockUserStateContext } from "../../../../../testUtils/userState";
import * as SpeciesOverride from "../../../../BattleChessGame/ChessManager/util";
import { PokemonSprite } from "../PokemonSprite";

// Mock the external dependencies
vi.mock("@pkmn/img", () => ({
  Sprites: {
    getPokemon: vi.fn().mockReturnValue({ url: "mock-pokemon-url" }),
    getSubstitute: vi.fn().mockReturnValue({ url: "mock-substitute-url" }),
  },
}));

vi.mock("@pkmn/dex", () => ({
  Dex: {
    species: {
      get: vi.fn().mockReturnValue({ id: "test-id" }),
    },
  },
}));

describe("PokemonSprite", () => {
  const defaultProps = {
    pokemonIdentifier: "pikachu",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
      getMockUserStateContext(),
    );
    vi.spyOn(SpeciesOverride, "speciesOverride").mockImplementation((id) => id);
  });

  describe("Rendering Modes", () => {
    it("should render as img by default", () => {
      render(<PokemonSprite {...defaultProps} />);
      expect(screen.getByRole("img")).toBeInTheDocument();
      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        "mock-pokemon-url",
      );
      expect(screen.getByRole("img")).toHaveAttribute("alt", "pikachu");
      expect(screen.getByRole("img")).toHaveAttribute("title", "pikachu");
    });

    it("should render as div when useDiv is true", () => {
      render(<PokemonSprite {...defaultProps} useDiv />);
      const div = screen.getByRole("img");
      expect(div.tagName).toBe("DIV");
      expect(div).toHaveStyle({
        backgroundImage: "url(mock-pokemon-url)",
      });
      expect(div).toHaveAttribute("aria-label", "pikachu");
    });
  });

  describe("Sprite Generation", () => {
    it("should use animated sprites by default", () => {
      render(<PokemonSprite {...defaultProps} />);
      expect(Sprites.getPokemon).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({ gen: "ani" }),
      );
    });

    it("should use 2D sprites when use2DSprites is true", () => {
      vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
        getMockUserStateContext({ use2DSprites: true }),
      );

      render(<PokemonSprite {...defaultProps} />);
      expect(Sprites.getPokemon).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({ gen: "gen5ani" }),
      );
    });

    it("should use substitute sprite when isSubstitute is true", () => {
      render(<PokemonSprite {...defaultProps} isSubstitute />);
      expect(Sprites.getSubstitute).toHaveBeenCalledWith(
        expect.objectContaining({ gen: "ani" }),
      );
      expect(Sprites.getPokemon).not.toHaveBeenCalled();
    });

    it("should use 2D substitute sprite when isSubstitute is true and use2DSprites is true", () => {
      vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
        getMockUserStateContext({ use2DSprites: true }),
      );

      render(<PokemonSprite {...defaultProps} isSubstitute />);
      expect(Sprites.getSubstitute).toHaveBeenCalledWith(
        expect.objectContaining({ gen: "gen5ani" }),
      );
      expect(Sprites.getPokemon).not.toHaveBeenCalled();
    });

    it("should pass sprite params correctly", () => {
      render(<PokemonSprite {...defaultProps} shiny gender="F" side="p1" />);

      expect(Sprites.getPokemon).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({
          gen: "ani",
          shiny: true,
          gender: "F",
          side: "p1",
        }),
      );
    });

    it("should pass side parameter to substitute sprite", () => {
      render(<PokemonSprite {...defaultProps} isSubstitute side="p2" />);

      expect(Sprites.getSubstitute).toHaveBeenCalledWith(
        expect.objectContaining({
          gen: "ani",
          side: "p2",
        }),
      );
    });

    it("should use species override for pokemon ID", () => {
      vi.spyOn(SpeciesOverride, "speciesOverride").mockReturnValue(
        "overridden-id",
      );

      render(<PokemonSprite {...defaultProps} />);

      expect(SpeciesOverride.speciesOverride).toHaveBeenCalledWith("test-id");
      expect(Sprites.getPokemon).toHaveBeenCalledWith(
        "overridden-id",
        expect.any(Object),
      );
    });
  });
});
