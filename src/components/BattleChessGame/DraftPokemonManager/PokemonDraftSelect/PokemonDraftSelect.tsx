import { GenderName, PokemonSet } from "@pkmn/data";
import { Sprites } from "@pkmn/img";
import './PokemonDraftSelect.css'

interface PokemonDraftSelectProps {
  draftablePokemon: PokemonSet[];
  onPokemonSelect: (index: number) => void
  selectedDraftablePokemon?: number | null;
}

const PokemonDraftSelect = ({ draftablePokemon, onPokemonSelect, selectedDraftablePokemon }: PokemonDraftSelectProps) => {

  return (
    <ul className='pokemonDraftSelectContainer'>
      {
        draftablePokemon.map((pokemon, index) => (
          <li key={index}>
            <button className={selectedDraftablePokemon === index ? 'selectedDraft' : ''} onClick={() => { onPokemonSelect(index); }}>
              <img src={Sprites.getPokemon(pokemon.species, { gender: pokemon.gender as GenderName }).url}/>
            </button>
          </li>
        ))
      }
    </ul>
  )
};

export default PokemonDraftSelect;