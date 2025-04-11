import { useState } from "react";
import { Chess, Color, Square } from "chess.js";
import { useGameState } from "../../../context/GameStateContext";
import PokemonDraftSelect from "./PokemonDraftSelect/PokemonDraftSelect";
import PokemonChessDetailsCard from "../PokemonManager/PokemonChessDetailsCard/PokemonChessDetailsCard";
import { PokemonBattleChessManager } from "../PokemonManager/PokemonBattleChessManager";
import ChessBoard from "../ChessManager/ChessBoard/ChessBoard";
import { PokemonChessBoardSquare } from "../ChessManager/types";
import { useUserState } from "../../../context/UserStateContext";
import Button from "../../common/Button/Button";
import './DraftPokemonManager.css';

interface DraftPokemonManager {
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  onDraftPokemon: (square: Square, draftPokemonIndex: number) => void;
  onBanPokemon: (draftPokemonIndex: number) => void;
  boardState: PokemonChessBoardSquare[][];
  draftTurnPick: Color;
}

const DraftPokemonManager = ({ pokemonManager, onDraftPokemon, boardState, draftTurnPick, onBanPokemon }: DraftPokemonManager) => {
  const { userState } = useUserState();
  const { gameState } = useGameState();

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draftPokemonSelected, setDraftPokemonSelected] = useState<number | null>(0);

  const cancelSelection = () => {
    setSelectedSquare(null);
  }

  const handleSquareClick = (square: Square) => {
    if (selectedSquare === square) {
      cancelSelection();
    } else {
      setSelectedSquare(square);
    }
    if (draftPokemonSelected !== null && pokemonManager.draftPieces.length <= 32) {
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
    <div className='draftManagerContainer'>
      <div className='draftGameContainer'>
        <ChessBoard
          boardState={boardState}
          onSquareClick={handleSquareClick}
          onPieceDrop={handleSquareClick}
          onPieceDrag={handleSquareClick}
          highlightedSquares={[]}
          selectedSquare={selectedSquare}
        />
        <PokemonChessDetailsCard
          pokemon={
            pokemonManager.getPokemonFromSquare(selectedSquare)?.pkmn || (draftPokemonSelected !== null ? pokemonManager.draftPieces[draftPokemonSelected] : null)
          }
        />
      </div>
      <div className='draftActions'>
        <div className='draftNotification'>
          {
            draftTurnPick === gameState.gameSettings.color ?
            (<strong>{ pokemonManager.draftPieces.length > 32 ? ('Select a pokemon that you want to ban, and the click "Ban Pokemon"!') : ('Select a pokemon you want to draft, and then select the chess piece to draft it!') }</strong>) :
            (<strong>Waiting for opponent...</strong>)
          }
        </div>
        <div className='banButton'>
          {
            draftPokemonSelected !== null && pokemonManager.draftPieces.length > 32 && draftTurnPick === gameState.gameSettings.color && !gameState.players.find((player) => player.playerId === userState.id)?.isSpectator?
            (<Button color='danger' onClick={() => onBanPokemon(draftPokemonSelected)}>Ban Pokemon</Button>) :
            null
          }
        </div>
        <PokemonDraftSelect
          onPokemonSelect={handleDraftPokemonSelected}
          draftablePokemon={pokemonManager.draftPieces}
          bannedPokemon={pokemonManager.banPieces}
          selectedDraftablePokemon={draftPokemonSelected}
        />
      </div>
    </div>
  );
}

export default DraftPokemonManager;