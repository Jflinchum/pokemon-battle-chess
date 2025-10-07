import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sprites } from "@pkmn/img";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PokemonDraftSelect, {
  PokemonDraftSelectProps,
} from "../PokemonDraftSelect";
import { getMockPokemonSet } from "../../../../../testUtils/pokemon";
import * as UserStateContext from "../../../../../context/UserState/UserStateContext";
import { getMockUserStateContext } from "../../../../../testUtils/userState";

vi.mock("@pkmn/img", () => ({
  Sprites: {
    getPokemon: vi.fn().mockReturnValue({ url: "mock-pokemon-url" }),
  },
}));

const defaultDraftablePokemon = [
  { set: getMockPokemonSet({ species: "pikachu" }), index: 0 },
  { set: getMockPokemonSet({ species: "charizard" }), index: 12 },
];

const defaultBannedPokemon = [
  { set: getMockPokemonSet({ species: "mewtwo" }), index: 2 },
];

const setup = (props: Partial<PokemonDraftSelectProps> = {}) => {
  vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
    getMockUserStateContext(),
  );

  const onPokemonSelectMock = vi.fn();

  const utils = render(
    <PokemonDraftSelect
      draftablePokemon={defaultDraftablePokemon}
      bannedPokemon={defaultBannedPokemon}
      onPokemonSelect={onPokemonSelectMock}
      {...props}
    />,
  );

  return {
    onPokemonSelectMock,
    getDraftableOptions: () => screen.queryAllByTestId(/^pokemon-draft-button/),
    getBannedOptions: () => screen.queryAllByTestId(/^pokemon-banned-button/),
    ...utils,
  };
};

describe("PokemonDraftSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render draftable Pokemon correctly", () => {
      const { getDraftableOptions } = setup();

      const draftableOptions = getDraftableOptions();
      expect(draftableOptions).toHaveLength(2);
      expect(draftableOptions[0]).toBeEnabled();
      expect(draftableOptions[1]).toBeEnabled();
    });

    it("should render banned Pokemon as disabled", () => {
      const { getBannedOptions } = setup();

      const bannedOptions = getBannedOptions();
      expect(bannedOptions).toHaveLength(1);
      expect(bannedOptions[0]).toBeDisabled();
    });

    it("should highlight the current selected Pokemon", () => {
      const { getDraftableOptions, rerender } = setup({
        selectedDraftablePokemon: 0,
      });

      let highlightedButton = getDraftableOptions().find((button) =>
        button.className.includes("highlighted"),
      );
      expect(highlightedButton).toBeTruthy();
      expect(highlightedButton).toHaveAttribute(
        "data-testid",
        "pokemon-draft-button-0",
      );

      rerender(
        <PokemonDraftSelect
          selectedDraftablePokemon={12}
          draftablePokemon={defaultDraftablePokemon}
          bannedPokemon={defaultBannedPokemon}
          onPokemonSelect={vi.fn()}
        />,
      );

      highlightedButton = getDraftableOptions().find((button) =>
        button.className.includes("highlighted"),
      );
      expect(highlightedButton).toBeTruthy();
      expect(highlightedButton).toHaveAttribute(
        "data-testid",
        "pokemon-draft-button-12",
      );
    });
  });

  describe("Event handler", () => {
    it("should call onPokemonSelect when clicking a draftable Pokemon", async () => {
      const onPokemonSelect = vi.fn();
      const { getDraftableOptions } = setup({ onPokemonSelect });

      const draftableOptions = getDraftableOptions();
      await userEvent.click(draftableOptions[0]);
      expect(onPokemonSelect).toHaveBeenCalledWith(0);

      await userEvent.click(draftableOptions[1]);
      expect(onPokemonSelect).toHaveBeenCalledWith(12);
    });

    it("should not call onPokemonSelect when clicking a banned Pokemon", async () => {
      const onPokemonSelect = vi.fn();
      const { getBannedOptions } = setup({ onPokemonSelect });

      const bannedOptions = getBannedOptions();
      await userEvent.click(bannedOptions[0]);

      expect(onPokemonSelect).not.toHaveBeenCalled();
    });

    it("should call onPokemonSelect when starting drag on a draftable Pokemon", () => {
      const { container, onPokemonSelectMock } = setup();

      const draggableElements =
        container.querySelectorAll("[draggable='true']");
      expect(draggableElements).toHaveLength(2);

      fireEvent.dragStart(draggableElements[1]);
      expect(onPokemonSelectMock).toHaveBeenCalledWith(12);
    });
  });

  describe("Empty States", () => {
    it("should handle empty draftable Pokemon list", () => {
      const { getDraftableOptions } = setup({
        draftablePokemon: [],
      });

      expect(getDraftableOptions()).toHaveLength(0);
    });

    it("should handle empty banned Pokemon list", () => {
      const { getBannedOptions } = setup({
        bannedPokemon: [],
      });

      expect(getBannedOptions()).toHaveLength(0);
    });
  });

  describe("Pokemon Sprites", () => {
    it("should render draftable Pokemon sprites with correct attributes", () => {
      const customPokemon = {
        set: getMockPokemonSet({
          species: "pikachu",
          gender: "F",
          shiny: true,
        }),
        index: 0,
      };

      setup({
        draftablePokemon: [customPokemon],
      });

      const spriteImg = screen
        .getByTestId("pokemon-draft-button-0")
        .querySelector("img");
      expect(spriteImg).toHaveAttribute("alt", "pikachu");
      expect(spriteImg).toHaveAttribute("src", "mock-pokemon-url");
      expect(Sprites.getPokemon).toHaveBeenCalledWith("pikachu", {
        gen: "ani",
        gender: "F",
        shiny: true,
      });
    });

    it("should render banned Pokemon sprites with correct attributes", () => {
      const customPokemon = {
        set: getMockPokemonSet({
          species: "pikachu",
          gender: "F",
          shiny: true,
        }),
        index: 0,
      };

      setup({
        bannedPokemon: [customPokemon],
      });

      const spriteImg = screen
        .getByTestId("pokemon-banned-button-0")
        .querySelector("img");
      expect(spriteImg).toHaveAttribute("alt", "pikachu");
      expect(spriteImg).toHaveAttribute("src", "mock-pokemon-url");
      expect(Sprites.getPokemon).toHaveBeenCalledWith("pikachu", {
        gen: "ani",
        gender: "F",
        shiny: true,
      });
    });
  });
});
