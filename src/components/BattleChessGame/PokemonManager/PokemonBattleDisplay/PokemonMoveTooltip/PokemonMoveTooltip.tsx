import { Dex } from "@pkmn/dex";
import PokemonType from "../../../../common/Pokemon/PokemonType/PokemonType";
import './PokemonMoveTooltip.css';

export const PokemonMoveTooltip = ({ move }: { move: string }) => {
  const dexMoveInfo = Dex.moves.get(move);
  return (
    <div>
      <div>
        <strong>{dexMoveInfo.name}</strong>
        <p><PokemonType type={dexMoveInfo.type} className='pokemonMoveType'/> - {dexMoveInfo.category}</p>
      </div>
      <hr/>
      <div>
        {
          dexMoveInfo.basePower ? (
            <p>Base power: {dexMoveInfo.basePower}</p>
          ) : null
        }
        {
          typeof dexMoveInfo.accuracy === 'number' && (
            <p>Accuracy: {dexMoveInfo.accuracy}</p>
          )
        }
        {
          dexMoveInfo.basePower || typeof dexMoveInfo.accuracy === 'number' ?
          (<hr/>) :
          (null)
        }
      </div>
      <div>
        {dexMoveInfo.shortDesc}
      </div>
    </div>
  );
}