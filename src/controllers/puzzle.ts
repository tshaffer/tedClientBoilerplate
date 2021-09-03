import axios from 'axios';
import { DisplayedPuzzle, ParsedClue, PuzzleEntity, PuzzleMetadata, PuzzleSpec } from '../types';
import { addPuzzle, addPuzzleMetadata, setPuzzleId } from '../models';

import { apiUrlFragment, serverUrl } from '../index';
import { addDisplayedPuzzle } from '../models';

export const loadPuzzlesMetadata = () => {
  return (dispatch: any) => {
    const path = serverUrl + apiUrlFragment + 'allPuzzlesMetadata';

    return axios.get(path)
      .then((puzzlesMetadataResponse: any) => {
        const puzzlesMetadata: PuzzleMetadata[] = (puzzlesMetadataResponse as any).data;
        // TEDTODO - add all in a single call
        for (const puzzleMetadata of puzzlesMetadata) {
          dispatch(addPuzzleMetadata(puzzleMetadata.id, puzzleMetadata));
        }
        if (puzzlesMetadata.length > 0) {
          dispatch(setPuzzleId(puzzlesMetadata[0].id));
        }
      });
  };
};

export const loadPuzzle = (id: string) => {
  return ((dispatch: any, getState: any): any => {
    const path = serverUrl + apiUrlFragment + 'puzzle?id=' + id;

    return axios.get(path)
      .then((puzzleResponse: any) => {
        const puzzleEntity: PuzzleEntity = puzzleResponse.data as PuzzleEntity;
        dispatch(addPuzzle(id, puzzleEntity));
        const displayedPuzzle: DisplayedPuzzle = buildDisplayedPuzzle(puzzleEntity);
        dispatch(addDisplayedPuzzle(id,displayedPuzzle));
      });
  });
};

export const buildDisplayedPuzzle = (puzzleEntity: PuzzleEntity): DisplayedPuzzle => {
  
  const displayedPuzzle: DisplayedPuzzle = {
    across: {},
    down: {},
  };

  const parsedClues: ParsedClue[] = puzzleEntity.parsedClues;
  for (const parsedClue of parsedClues) {
    const { col, isAcross, row, solution, text } = parsedClue;
    if (isAcross) {
      displayedPuzzle.across[parsedClue.number] = {
        clue: text,
        answer: solution,
        row,
        col,
      };
    } else {
      displayedPuzzle.down[parsedClue.number] = {
        clue: text,
        answer: solution,
        row,
        col,
      };
    }
  }
  
  return displayedPuzzle;
};
