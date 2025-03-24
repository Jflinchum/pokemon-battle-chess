import { Dex } from "@pkmn/dex";
import './PokemonMoveChoices.css';

interface PokemonMoveChoicesProps {
  moves: string[];
  onMoveSelect?: (move: string) => void;
}

const PokemonMoveChoices = ({ moves, onMoveSelect = () => {} }: PokemonMoveChoicesProps) => {

  return (
    <div className='movesContainer'>
      {moves.map((move, index) => {
        const dexMoveInfo = Dex.moves.get(move);

        return (
          <button key={index} className='moveButton' onClick={() => {onMoveSelect(move)}}>
            {dexMoveInfo.name}
            <div className='moveTooltip'>
              <div>
                <strong>{dexMoveInfo.name}</strong>
                <p>{dexMoveInfo.type} - {dexMoveInfo.category}</p>
              </div>
              <hr/>
              {
                dexMoveInfo.basePower && dexMoveInfo.accuracy ? (
                  <div>
                    <p>Base power: {dexMoveInfo.basePower}</p>
                    <p>Accuracy: {dexMoveInfo.accuracy}</p>
                    <hr/>
                  </div>
                ) : null
              }
              <div>
                {dexMoveInfo.shortDesc}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default PokemonMoveChoices;
