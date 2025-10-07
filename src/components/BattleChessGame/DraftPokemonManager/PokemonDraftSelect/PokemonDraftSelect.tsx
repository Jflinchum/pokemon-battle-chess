import { GenderName, PokemonSet } from "@pkmn/data";
import { PokemonSprite } from "../../../common/Pokemon/PokemonSprite/PokemonSprite";
import Button from "../../../common/Button/Button";
import "./PokemonDraftSelect.css";

export interface PokemonDraftSelectProps {
  draftablePokemon: { set: PokemonSet; index: number }[];
  bannedPokemon: { set: PokemonSet; index: number }[];
  onPokemonSelect: (index: number) => void;
  selectedDraftablePokemon?: number | null;
}

const PokemonDraftSelect = ({
  draftablePokemon,
  onPokemonSelect,
  selectedDraftablePokemon,
  bannedPokemon,
}: PokemonDraftSelectProps) => {
  return (
    <ul className="pokemonDraftSelectContainer">
      {draftablePokemon.map((pokemon) => (
        <li key={pokemon.index}>
          <Button
            highlighted={selectedDraftablePokemon === pokemon.index}
            className="pokemonDraftOption"
            onClick={() => {
              onPokemonSelect(pokemon.index);
            }}
            data-testid={`pokemon-draft-button-${pokemon.index}`}
          >
            <div
              draggable
              onDragStart={() => onPokemonSelect(pokemon.index)}
              className="pokemonDraftSprite"
            >
              <PokemonSprite
                pokemonIdentifier={pokemon.set.species}
                gender={pokemon.set.gender as GenderName}
                shiny={pokemon.set.shiny}
              />
            </div>
          </Button>
        </li>
      ))}
      {bannedPokemon.map((pokemon) => (
        <li key={pokemon.index}>
          <button
            disabled
            className={"bannedDraft"}
            data-testid={`pokemon-banned-button-${pokemon.index}`}
          >
            <PokemonSprite
              className="pokemonDraftSprite"
              pokemonIdentifier={pokemon.set.species}
              gender={pokemon.set.gender as GenderName}
              shiny={pokemon.set.shiny}
            />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default PokemonDraftSelect;
