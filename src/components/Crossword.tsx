/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react';
import { useState, useContext } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { CellGuess, DisplayedPuzzle, GridDataState, Guesses } from '../types';

import { ThemeContext, ThemeProvider } from 'styled-components';

import Cell from './Cell';
import DirectionClues from './DirectionClues';

import { getActivePuzzle, getGuesses } from '../selectors';
import { bothDirections, isAcross, otherDirection } from '../utilities';
import { isNil } from 'lodash';

import { CrosswordContext, CrosswordSizeContext } from './context';
import { getGridDataState } from '../selectors';

const defaultTheme = {
  columnBreakpoint: '768px',
  gridBackground: 'rgb(0,0,0)',
  cellBackground: 'rgb(255,255,255)',
  cellBorder: 'rgb(0,0,0)',
  textColor: 'rgb(0,0,0)',
  remoteGuessTextColor: 'rgb(255, 0, 255)',
  numberColor: 'rgba(0,0,0, 0.25)',
  focusBackground: 'rgb(255,255,0)',
  highlightBackground: 'rgb(255,255,204)',
};

export interface CrosswordPropsFromParent {
  onUpdateGuess: (row: number, col: number, char: string) => any;
}

export interface CrosswordProps extends CrosswordPropsFromParent {
  activePuzzle: DisplayedPuzzle;
  gridDataState: GridDataState;
  guesses: Guesses;
}

const Crossword = (props: CrosswordProps) => {

  const [size, setSize] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [clues, setClues] = useState(null);
  const [focused, setFocused] = useState(false);
  const [focusedRow, setFocusedRow] = useState(0);
  const [focusedCol, setFocusedCol] = useState(0);
  const [currentDirection, setCurrentDirection] = useState('across');
  const [currentNumber, setCurrentNumber] = useState('1');

  React.useEffect(() => {

    // eslint-disable-next-line no-shadow
    // const { size, gridData, clues } = createGridData(props.activePuzzle);
    const { size, gridData, clues } = props.gridDataState;

    // let loadedCorrect;

    setSize(size);
    setGridData(gridData);
    setClues(clues);

    // Should we start with 1-across highlighted/focused?

    // TODO: track input-field focus so we don't draw highlight when we're not
    // really focused, *and* use first actual clue (whether across or down?)
    // if (onFocusedCellChange) {
    //   onFocusedCellChange(0, 0, 'across');
    // }
    setFocusedRow(0);
    setFocusedCol(0);
    setCurrentDirection('across');
    setCurrentNumber('1');

  }, [props.activePuzzle, props.gridDataState]);

  const inputRef = React.useRef();

  const contextTheme = useContext(ThemeContext);

  const getCellData = (row, col) => {
    if (row >= 0 && row < size && col >= 0 && col < size) {
      return gridData[row][col];
    }

    // fake cellData to represent "out of bounds"
    return { row, col, used: false, outOfBounds: true };
  };

  const handleCellClick = (cellData) => {
    const { row, col } = cellData;
    const other = otherDirection(currentDirection);

    // should this use moveTo?
    setFocusedRow(row);
    setFocusedCol(col);

    let direction = currentDirection;

    // We switch to the "other" direction if (a) the current direction isn't
    // available in the clicked cell, or (b) we're already focused and the
    // clicked cell is the focused cell, *and* the other direction is
    // available.
    if (
      !cellData[currentDirection] ||
      (focused &&
        row === focusedRow &&
        col === focusedCol &&
        cellData[other])
    ) {
      setCurrentDirection(other);
      direction = other;
    }

    setCurrentNumber(cellData[direction]);

    focus();
  };

  // focus and movement
  const focus = () => {
    if (!isNil(inputRef) && !isNil(inputRef.current)) {
      (inputRef as any).current.focus();
      setFocused(true);
    }
    setFocused(true);
  };

  const moveTo = (row, col, directionOverride) => {

    // let direction = directionOverride ?? currentDirection;
    let direction: string;
    if (isNil(directionOverride)) {
      direction = currentDirection;
    } else {
      direction = directionOverride;
    }

    const candidate = getCellData(row, col);

    if (!candidate.used) {
      return false;
    }

    if (!candidate[direction]) {
      direction = otherDirection(direction);
    }

    setFocusedRow(row);
    setFocusedCol(col);
    setCurrentDirection(direction);
    setCurrentNumber(candidate[direction]);

    return candidate;
  };

  const moveRelative = (dRow, dCol) => {
    // We expect *only* one of dRow or dCol to have a non-zero value, and
    // that's the direction we will "prefer".  If *both* are set (or zero),
    // we don't change the direction.
    let direction;
    if (dRow !== 0 && dCol === 0) {
      direction = 'down';
    } else if (dRow === 0 && dCol !== 0) {
      direction = 'across';
    }

    const cell = moveTo(focusedRow + dRow, focusedCol + dCol, direction);

    return cell;
  };

  const moveForward = () => {
    const across = isAcross(currentDirection);
    moveRelative(across ? 0 : 1, across ? 1 : 0);
  };

  const moveBackward = () => {
    const across = isAcross(currentDirection);
    moveRelative(across ? 0 : -1, across ? -1 : 0);
  };

  // We use the keydown event for control/arrow keys, but not for textual
  // input, because it's hard to suss out when a key is "regular" or not.
  const handleInputKeyDown = (event) => {

    // if ctrl, alt, or meta are down, ignore the event (let it bubble)
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    let preventDefault = true;
    const { key } = event;

    // FUTURE: should we "jump" over black space?  That might help some for
    // keyboard users.
    switch (key) {
      case 'ArrowUp':
        moveRelative(-1, 0);
        break;

      case 'ArrowDown':
        moveRelative(1, 0);
        break;

      case 'ArrowLeft':
        moveRelative(0, -1);
        break;

      case 'ArrowRight':
        moveRelative(0, 1);
        break;

      case ' ': // treat space like tab?
      case 'Tab': {
        const other = otherDirection(currentDirection);
        const cellData = getCellData(focusedRow, focusedCol);
        if (cellData[other]) {
          setCurrentDirection(other);
          setCurrentNumber(cellData[other]);
        }
        break;
      }

      // Backspace: delete the current cell, and move to the previous cell
      // Delete:    delete the current cell, but don't move
      case 'Backspace':
      case 'Delete': {
        props.onUpdateGuess(focusedRow, focusedCol, '');
        if (key === 'Backspace') {
          moveBackward();
        }
        break;
      }

      case 'Home':
      case 'End': {

        // move to beginning/end of this entry?
        const info = props.activePuzzle[currentDirection][currentNumber];
        const {
          answer: { length },
        } = info;
        let { row, col } = info;
        if (key === 'End') {
          const across = isAcross(currentDirection);
          if (across) {
            col += length - 1;
          } else {
            row += length - 1;
          }
        }

        moveTo(row, col, null);
        break;
      }

      default:
        // It would be nice to handle "regular" characters with onInput, but
        // that is still experimental, so we can't count on it.  Instead, we
        // assume that only "length 1" values are regular.
        if (key.length !== 1) {
          preventDefault = false;
          break;
        }

        props.onUpdateGuess(focusedRow, focusedCol, key.toUpperCase());
        moveForward();

        break;
    }

    if (preventDefault) {
      event.preventDefault();
    }
  };

  const handleInputClick = () => {

    // *don't* event.preventDefault(), because we want the input to actually
    // take focus

    // Like general cell-clicks, cliking on the input can change direction.
    // Unlike cell clicks, we *know* we're clicking on the already-focused
    // cell!

    const other = otherDirection(currentDirection);
    const cellData = getCellData(focusedRow, focusedCol);

    let direction = currentDirection;

    if (focused && cellData[other]) {
      setCurrentDirection(other);
      direction = other;
    }

    setCurrentNumber(cellData[direction]);
    focus();
  };

  const handleClueSelected = (direction, number) => {
    const info = props.activePuzzle[direction][number];
    // TODO: sanity-check info?
    moveTo(info.row, info.col, direction);
    focus();
  };

  const cellSize = 100 / size;
  const cellPadding = 0.125;
  const cellInner = cellSize - cellPadding * 2;
  const cellHalf = cellSize / 2;
  const fontSize = cellInner * 0.7;

  const context = {
    focused,
    selectedDirection: currentDirection,
    selectedNumber: currentNumber,
    onClueSelected: handleClueSelected,
  };
  // const finalTheme = { ...defaultTheme, ...contextTheme, ...theme };
  const finalTheme = { ...defaultTheme, ...contextTheme };

  const cells = [];
  if (gridData) {

    bothDirections.every((direction) =>
      clues[direction].every((clueInfo) => {
        return clueInfo.correct;
      })
    );

    gridData.forEach((rowData, row) => {
      rowData.forEach((cellData, col) => {

        const guess: CellGuess = props.guesses[row][col];

        cellData.guess = guess.guess;

        if (!cellData.used) {
          return;
        }
        cells.push(
          <Cell
            // eslint-disable-next-line react/no-array-index-key
            key={`R${row}C${col}`}
            row={cellData.row}
            col={cellData.col}
            guess={cellData.guess}
            number={cellData.number}
            focus={focused && row === focusedRow && col === focusedCol}
            highlight={
              focused &&
              currentNumber &&
              cellData[currentDirection] === currentNumber
            }
            onClick={handleCellClick}
          />
        );
      });
    });
  }

  return (
    <CrosswordContext.Provider value={context}>
      <CrosswordSizeContext.Provider
        value={{ cellSize, cellPadding, cellInner, cellHalf, fontSize }}
      >
        <ThemeProvider theme={finalTheme}>
          <div style={{ margin: 0, padding: 0, border: 0, display: 'flex', flexDirection: 'row' }}>
            <div style={{ minWidth: '20rem', maxWidth: '60rem', width: 'auto', flex: '2 1 50%' }}>
              <div style={{ margin: 0, padding: 0, position: 'relative' }}>
                <svg viewBox="0 0 100 100">
                  <rect
                    x={0}
                    y={0}
                    width={100}
                    height={100}
                    fill={finalTheme.gridBackground}
                  />
                  {cells}
                </svg>
                <input
                  aria-label="crossword-input"
                  type="text"
                  onClick={handleInputClick}
                  onKeyDown={handleInputKeyDown}
                  value=""
                  // onInput={this.handleInput}
                  autoComplete="off"
                  spellCheck="false"
                  autoCorrect="off"
                  style={{
                    position: 'absolute',
                    // In order to ensure the top/left positioning makes sense,
                    // there is an absolutely-positioned <div> with no
                    // margin/padding that we *don't* expose to consumers.  This
                    // keeps the math much more reliable.  (But we're still
                    // seeing a slight vertical deviation towards the bottom of
                    // the grid!  The "* 0.995" seems to help.)
                    top: `calc(${focusedRow * cellSize * 0.995}% + 2px)`,
                    left: `calc(${focusedCol * cellSize}% + 2px)`,
                    width: `calc(${cellSize}% - 4px)`,
                    height: `calc(${cellSize}% - 4px)`,
                    fontSize: `${fontSize * 6}px`, // waaay too small...?
                    textAlign: 'center',
                    textAnchor: 'middle',
                    backgroundColor: 'transparent',
                    caretColor: 'transparent',
                    margin: 0,
                    padding: 0,
                    border: 0,
                    cursor: 'default',
                  }}
                />
              </div>
            </div >
            <div style={{ padding: '0 1em', flex: '1 2 25%' }}>
              {clues &&
                bothDirections.map((direction) => (
                  <DirectionClues
                    key={direction}
                    direction={direction}
                    clues={clues[direction]}
                  />
                ))}

            </div>
          </div>
        </ThemeProvider>
      </CrosswordSizeContext.Provider>
    </CrosswordContext.Provider>
  );
};

function mapStateToProps(state: any) {
  return {
    activePuzzle: getActivePuzzle(state),
    gridDataState: getGridDataState(state),
    guesses: getGuesses(state),
  };
}

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators({
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Crossword);
