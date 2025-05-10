import { GenderName, PokemonSet } from "@pkmn/data";
import { PokemonSprite } from "../../../common/Pokemon/PokemonSprite/PokemonSprite";
import './PokemonDraftSelect.css'

interface PokemonDraftSelectProps {
  draftablePokemon: PokemonSet[];
  bannedPokemon: PokemonSet[];
  onPokemonSelect: (index: number) => void
  selectedDraftablePokemon?: number | null;
}

const PokemonDraftSelect = ({ draftablePokemon, onPokemonSelect, selectedDraftablePokemon, bannedPokemon }: PokemonDraftSelectProps) => {

  return (
    <ul className='pokemonDraftSelectContainer'>
      {
        draftablePokemon.map((pokemon, index) => (
          <li key={index}>
            <button className={`pokemonDraftOption ${selectedDraftablePokemon === index ? 'selectedDraft' : ''}`} onClick={() => { onPokemonSelect(index); }}>
              <div
                draggable
                onDragStart={() => onPokemonSelect(index)}
                className='pokemonDraftSprite'
              >
                <PokemonSprite
                  pokemonIdentifier={pokemon.species}
                  gender={pokemon.gender as GenderName}
                  shiny={pokemon.shiny}
                />
              </div>
            </button>
          </li>
        ))
      }
      {
        bannedPokemon.map((pokemon, index) => (
          <li key={index}>
            <button disabled className={'bannedDraft'} onClick={() => { onPokemonSelect(index); }}>
              <PokemonSprite
                className='pokemonDraftSprite'
                pokemonIdentifier={pokemon.species}
                gender={pokemon.gender as GenderName}
                shiny={pokemon.shiny}
              />
            </button>
          </li>
        ))
      }
    </ul>
  )
};

export default PokemonDraftSelect;