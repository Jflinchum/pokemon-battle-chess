import { useState } from "react";
import { Chess, Color, Square } from "chess.js";
import { useGameState } from "../../../context/GameState/GameStateContext";
import PokemonDraftSelect from "./PokemonDraftSelect/PokemonDraftSelect";
import PokemonChessDetailsCard from "../PokemonManager/PokemonChessDetailsCard/PokemonChessDetailsCard";
import { PokemonBattleChessManager } from "../../../../shared/models/PokemonBattleChessManager";
import ChessBoard from "../ChessManager/ChessBoard/ChessBoard";
import Button from "../../common/Button/Button";
import { PokemonChessBoardSquare } from "../../../types/chess/PokemonChessBoardSquare";
import "./DraftPokemonManager.css";

interface DraftPokemonManagerProps {
  chessManager: Chess;
  pokemonManager: PokemonBattleChessManager;
  onDraftPokemon: (square: Square, draftPokemonIndex: number) => void;
  onBanPokemon: (draftPokemonIndex: number) => void;
  boardState: PokemonChessBoardSquare[][];
  draftTurnPick: Color;
}

const DraftPokemonManager = ({
  pokemonManager,
  onDraftPokemon,
  boardState,
  draftTurnPick,
  onBanPokemon,
}: DraftPokemonManagerProps) => {
  const { gameState } = useGameState();

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draftPokemonSelected, setDraftPokemonSelected] = useState<
    number | null
  >(0);

  const cancelSelection = () => {
    setSelectedSquare(null);
  };

  const handleSquareClick = ({ square }: PokemonChessBoardSquare) => {
    if (selectedSquare === square) {
      cancelSelection();
    } else {
      setSelectedSquare(square);
    }
    if (
      draftPokemonSelected !== null &&
      pokemonManager.draftPieces.length <= 32
    ) {
      onDraftPokemon(square, draftPokemonSelected);
      setDraftPokemonSelected(null);
    }
    return;
  };

  const handleDraftPokemonSelected = (draftIndex: number) => {
    setDraftPokemonSelected(draftIndex);
    setSelectedSquare(null);
  };

  return (
    <div className="draftManagerContainer">
      <div className="draftGameContainer">
        <ChessBoard
          color={gameState.gameSettings.color || "w"}
          boardState={boardState}
          onSquareClick={handleSquareClick}
          onPieceDrop={handleSquareClick}
          onPieceDrag={handleSquareClick}
          highlightedSquares={[]}
          selectedSquare={selectedSquare}
        />
        <PokemonChessDetailsCard
          squareModifier={pokemonManager.getModifiersFromSquare(selectedSquare)}
          pokemon={
            pokemonManager.getPokemonFromSquare(selectedSquare)?.pkmn ||
            (draftPokemonSelected !== null
              ? pokemonManager.draftPieces[
                  pokemonManager.draftPieces.findIndex(
                    ({ index }) => index === draftPokemonSelected,
                  )
                ]?.set
              : null)
          }
        />
      </div>
      <div className="draftActions">
        <div className="draftNotification">
          {draftTurnPick === gameState.gameSettings.color ? (
            <strong>
              {pokemonManager.draftPieces.length > 32
                ? `Ban a Pokémon! You have ${3 - Math.floor(pokemonManager.banPieces.length / 2)} bans left.`
                : "Select a Pokémon you want to draft, and then select the chess piece to draft it!"}
            </strong>
          ) : (
            <strong>Waiting for opponent...</strong>
          )}
        </div>
        <div className="banButton">
          {draftPokemonSelected !== null &&
          pokemonManager.draftPieces.length > 32 &&
          draftTurnPick === gameState.gameSettings.color &&
          !gameState.isSpectator ? (
            <Button
              color="danger"
              onClick={() => onBanPokemon(draftPokemonSelected)}
            >
              Ban Pokemon
            </Button>
          ) : null}
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
};

export default DraftPokemonManager;
