import * as CubeModule from 'cubejs';
const Cube = (CubeModule as any).default || CubeModule;

export type FaceColor = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

// Type definition for the structure of a solved cube, if needed.
export interface SolvedCube {
  cross: string;
  f2l: string[];
  oll: string;
  pll: string;
}

export class CubeAdapter {
    private cube: any;

    constructor() {
        this.cube = new Cube();
    }

    /** Gets the current state of the cube as a 54-character string. */
    getState(): string {
        return this.cube.asString();
    }

    /** Executes a move or a sequence of moves. */
    move(sequence: string) {
        this.cube.move(sequence);
    }

    /**
     * Randomizes the cube state.
     * Note: We use the static `Cube.random()` method as it's the standard
     * way in cubejs to generate a new, solvable, random cube instance.
     * `this.cube.randomize()` is not the preferred API.
     */
    randomize() {
        this.cube = Cube.random();
    }

    /** Solves the entire cube and returns the full solution as an array of moves. */
    solve(): string[] | null {
        try {
            const result = this.cube.solve();
            if (typeof result === 'string' && result.length > 0) {
                return result.split(' ');
            }
            return []; // Already solved or no solution found
        } catch (e) {
            console.error('Error solving cube:', e, 'Current state:', this.getState());
            return null; // Indicates an error occurred
        }
    }
    
    /** Solves just the cross and returns the moves. */
    solveCross(): string[] | null {
        try {
            const solution = Cube.solve(this.getState(), 'cross');
            return solution ? solution.split(' ') : [];
        } catch (e) {
            console.error('Error solving cross:', e);
            return null;
        }
    }

    /** Solves the next F2L pair and returns the moves. */
    solveF2L(): string[] | null {
        try {
            const solution = Cube.solve(this.getState(), 'f2l');
            return solution ? solution.split(' ') : [];
        } catch (e) {
            console.error('Error solving F2L:', e);
            return null;
        }
    }

    /** Solves the OLL and returns the moves. */
    solveOLL(): string[] | null {
        try {
            const solution = Cube.solve(this.getState(), 'oll');
            return solution ? solution.split(' ') : [];
        } catch (e) {
            console.error('Error solving OLL:', e);
            return null;
        }
    }

    /** Solves the PLL and returns the moves. */
    solvePLL(): string[] | null {
        try {
            const solution = Cube.solve(this.getState(), 'pll');
            return solution ? solution.split(' ') : [];
        } catch (e) {
            console.error('Error solving PLL:', e);
            return null;
        }
    }


    /** Resets the cube to its initial, solved state. */
    reset() {
        this.cube = new Cube();
    }

    /**
     * Gets the colors of each face as a record of string arrays.
     * The order of colors in each array corresponds to the cubejs string representation.
     */
    getFaceColors(): Record<FaceColor, string[]> {
        const state = this.getState();
        // cubejs face order: U, R, F, D, L, B
        if (state.length !== 54) {
            console.warn('Invalid cube state string length:', state.length, state);
            return { U: [], R: [], F: [], D: [], L: [], B: [] };
        }
        return {
            U: state.slice(0, 9).split(''),
            R: state.slice(9, 18).split(''),
            F: state.slice(18, 27).split(''),
            D: state.slice(27, 36).split(''),
            L: state.slice(36, 45).split(''),
            B: state.slice(45, 54).split(''),
        };
    }
}
''
