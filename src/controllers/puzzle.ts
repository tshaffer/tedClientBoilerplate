import axios from 'axios';
import { PuzzleEntity, PuzzleMetadata, PuzzleSpec } from '../types';
import { addPuzzle, addPuzzleMetadata, setPuzzleId } from '../models';

import { apiUrlFragment, serverUrl } from '../index';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PuzCrossword = require('@confuzzle/puz-crossword').PuzCrossword;

export const loadPuzzle = (id: string) => {
  return ((dispatch: any, getState: any): any => {
    // const path = 'http://localhost:8888/api/v1/puzzle?id=' + id;
    const path = serverUrl + apiUrlFragment + 'puzzle?id=' + id;

    return axios.get(path)
      .then((puzzleResponse: any) => {
        const puzzleEntity: PuzzleEntity = puzzleResponse.data as PuzzleEntity;
        dispatch(addPuzzle(id, puzzleEntity));
      });
  });
};

export const loadPuzzlesMetadata = () => {
  return (dispatch: any) => {
    // const path = 'http://localhost:8888/api/v1/allPuzzlesMetadata';
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

const parsePuzzleFile = (puzFile: File): Promise<PuzzleSpec> => {

  return new Promise((resolve, reject) => {

    const fileReader: FileReader = new FileReader();

    // TEDTODO - err event
    fileReader.onload = function () {
      const puzData: Buffer = Buffer.from(fileReader.result as ArrayBuffer);
      const puzzleSpec: PuzzleSpec = PuzCrossword.from(puzData);
      resolve(puzzleSpec);
    };

    fileReader.readAsArrayBuffer(puzFile);
  });
};

const parsePuzzleFiles = (puzFiles: File[]): Promise<PuzzleSpec[]> => {

  const puzzleSpecs: PuzzleSpec[] = [];

  const parseNextPuzzleFile = (index: number): Promise<PuzzleSpec[]> => {

    if (index >= puzFiles.length) {
      return Promise.resolve(puzzleSpecs);
    }

    return parsePuzzleFile(puzFiles[index])
      .then((puzzleSpec: PuzzleSpec) => {
        puzzleSpecs.push(puzzleSpec);
        return parseNextPuzzleFile(index + 1);
      });
  };

  return parseNextPuzzleFile(0);
};
