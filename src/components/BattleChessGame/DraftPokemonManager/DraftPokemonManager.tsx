import { useState, useMemo } from "react";
import { Chess, Color, Square } from "chess.js";
import { useGameState } from "../../../context/GameStateContext";
import PokemonDraftSelect from "./PokemonDraftSelect/PokemonDraftSelect";
import PokemonDetailsCard from "../PokemonManager/PokemonDetailsCard/PokemonDetailsCard";
import { PokemonBattleChessManager } from "../PokemonManager/PokemonBattleChessManager";
import ChessBoard from "../ChessManager/ChessBoard/ChessBoard";
import { PokemonChessBoardSquare } from "../ChessManager/types";
import './DraftPokemonManager.css';

interface DraftPokemonManager {
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  onDraftPokemon: (square: Square, draftPokemonIndex: number) => void;
  boardState: PokemonChessBoardSquare[][];
  draftTurnPick: Color;
}

const DraftPokemonManager = ({ pokemonManager, onDraftPokemon, boardState, draftTurnPick }: DraftPokemonManager) => {
  const { gameState } = useGameState();

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draftPokemonSelected, setDraftPokemonSelected] = useState<number | null>(null)

  const draftablePokemon = useMemo(() => gameState.gameSettings.color === 'w' ? pokemonManager.getWhiteDraftPieces() : pokemonManager.getBlackDraftPieces(), []);

  const cancelSelection = () => {
    setSelectedSquare(null);
  }

  const handleSquareClick = (square: Square) => {
    if (selectedSquare === square) {
      cancelSelection();
    } else {
      setSelectedSquare(square);
    }
    if (draftPokemonSelected !== null) {
      // draft piece
      onDraftPokemon(square, draftPokemonSelected)
      setDraftPokemonSelected(null);
    }
    return;
  };

  const handleDraftPokemonSelected = (draftIndex: number) => {
    setDraftPokemonSelected(draftIndex)
    setSelectedSquare(null);
  }

  return (
    <div>
      {
        draftTurnPick === gameState.gameSettings.color ?
        (<span>Your turn to pick!</span>) :
        (<span>Waiting for opponent to pick.</span>)
      }
      <div className='draftGameContainer'>
        <ChessBoard
          boardState={boardState}
          onSquareClick={handleSquareClick}
          highlightedSquares={[]}
          selectedSquare={selectedSquare}
        />
        <PokemonDetailsCard
          pokemon={
            pokemonManager.getPokemonFromSquare(selectedSquare)?.pkmn || (draftPokemonSelected !== null ? draftablePokemon[draftPokemonSelected] : null)
          }
        />
      </div>
      <PokemonDraftSelect
        onPokemonSelect={handleDraftPokemonSelected}
        draftablePokemon={draftablePokemon}
        selectedDraftablePokemon={draftPokemonSelected}
      />
    </div>
  );
}

export default DraftPokemonManager;