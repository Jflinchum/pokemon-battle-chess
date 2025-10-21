import { GenderName, PokemonSet } from "@pkmn/data";
import Button from "../../../common/Button/Button";
import { PokemonSprite } from "../../../common/Pokemon/PokemonSprite/PokemonSprite";
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
        <li key={pokemon.index} className="pokemonDraftItem">
          <Button
            highlighted={selectedDraftablePokemon === pokemon.index}
            className="pokemonDraftOption"
            onClick={() => {
              onPokemonSelect(pokemon.index);
            }}
            data-testid={`pokemon-draft-button-${pokemon.index}`}
          >
            <PokemonSprite
              className="pokemonDraftSprite"
              onDragStart={() => onPokemonSelect(pokemon.index)}
              draggable
              pokemonIdentifier={pokemon.set.species}
              gender={pokemon.set.gender as GenderName}
              shiny={pokemon.set.shiny}
              useDiv
            />
          </Button>
        </li>
      ))}
      {bannedPokemon.map((pokemon) => (
        <li key={pokemon.index} className="pokemonDraftItem">
          <Button
            disabled
            className={"bannedDraft"}
            data-testid={`pokemon-banned-button-${pokemon.index}`}
          >
            <PokemonSprite
              useDiv
              className="pokemonDraftSprite"
              pokemonIdentifier={pokemon.set.species}
              gender={pokemon.set.gender as GenderName}
              shiny={pokemon.set.shiny}
            />
          </Button>
        </li>
      ))}
    </ul>
  );
};

export default PokemonDraftSelect;
