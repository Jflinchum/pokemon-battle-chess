import { GenderName, PokemonSet } from "@pkmn/data";
import { Sprites } from "@pkmn/img";
import './PokemonDraftSelect.css'
import { speciesOverride } from "../../ChessManager/util";

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
            <button className={selectedDraftablePokemon === index ? 'selectedDraft' : ''} onClick={() => { onPokemonSelect(index); }}>
              <div
                draggable
                onDragStart={() => onPokemonSelect(index)}
                className='pokemonDraftSprite'
                style={{ backgroundImage: `url(${Sprites.getPokemon(speciesOverride(pokemon.species), { gender: pokemon.gender as GenderName }).url})` }}
              />
            </button>
          </li>
        ))
      }
      {
        bannedPokemon.map((pokemon, index) => (
          <li key={index}>
            <button disabled className={'bannedDraft'} onClick={() => { onPokemonSelect(index); }}>
              <div
                className='pokemonDraftSprite'
                style={{ backgroundImage: `url(${Sprites.getPokemon(speciesOverride(pokemon.species), { gender: pokemon.gender as GenderName }).url})` }}
              />
            </button>
          </li>
        ))
      }
    </ul>
  )
};

export default PokemonDraftSelect;