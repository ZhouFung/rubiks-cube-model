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

    /**
     * Returns animation details (axis, angle, affected cubelet indices) for a given move.
     * This method does NOT modify the cube's state.
     */
    getAnimationDetails(move: string): AnimationDetails | undefined {
        return moveAnimationMap[move];
    }
}

// Helper to get cubelet index from (x, y, z) coordinates
// Assuming cubelets are indexed from 0 to 26 based on their (x, y, z) positions
// where x, y, z are -1, 0, 1.
// Indexing: x + y*3 + z*9 (if x,y,z are mapped to 0,1,2)
function getCubeletIndex(x: number, y: number, z: number): number {
    // Map -1, 0, 1 to 0, 1, 2 for array indexing
    const mapCoord = (coord: number) => coord + 1;
    return mapCoord(x) + mapCoord(y) * 3 + mapCoord(z) * 9;
}

// Helper to get cubelet indices for a given face/slice
function getCubeletIndicesForFace(axis: 'x' | 'y' | 'z', value: -1 | 0 | 1): number[] {
    const indices: number[] = [];
    for (let z = -1; z <= 1; z++) {
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                if ((axis === 'x' && x === value) ||
                    (axis === 'y' && y === value) ||
                    (axis === 'z' && z === value)) {
                    indices.push(getCubeletIndex(x, y, z));
                }
            }
        }
    }
    return indices;
}

// Define the animation details for each move
interface AnimationDetails {
    axis: 'x' | 'y' | 'z';
    angle: number; // in radians
    cubeletIndices: number[];
}

// Angle for a single turn (90 degrees)
const QUARTER_TURN = Math.PI / 2;

// Mapping of moves to animation details
const moveAnimationMap: { [key: string]: AnimationDetails } = {
    'R': { axis: 'x', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('x', 1) },
    "R'": { axis: 'x', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('x', 1) },
    'R2': { axis: 'x', angle: -QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('x', 1) },

    'L': { axis: 'x', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('x', -1) },
    "L'": { axis: 'x', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('x', -1) },
    'L2': { axis: 'x', angle: QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('x', -1) },

    'U': { axis: 'y', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('y', 1) },
    "U'": { axis: 'y', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('y', 1) },
    'U2': { axis: 'y', angle: -QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('y', 1) },

    'D': { axis: 'y', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('y', -1) },
    "D'": { axis: 'y', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('y', -1) },
    'D2': { axis: 'y', angle: QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('y', -1) },

    'F': { axis: 'z', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('z', 1) },
    "F'": { axis: 'z', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('z', 1) },
    'F2': { axis: 'z', angle: -QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('z', 1) },

    'B': { axis: 'z', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('z', -1) },
    "B'": { axis: 'z', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('z', -1) },
    'B2': { axis: 'z', angle: QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('z', -1) },

    // Middle slice moves (M, S, E) - these are relative to the standard axes
    // M: L' x (rotate middle slice around X axis, same direction as L)
    'M': { axis: 'x', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('x', 0) },
    "M'": { axis: 'x', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('x', 0) },
    'M2': { axis: 'x', angle: QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('x', 0) },

    // S: F B' (rotate middle slice around Z axis, same direction as F)
    'S': { axis: 'z', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('z', 0) },
    "S'": { axis: 'z', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('z', 0) },
    'S2': { axis: 'z', angle: -QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('z', 0) },

    // E: U D' (rotate middle slice around Y axis, same direction as D)
    'E': { axis: 'y', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('y', 0) },
    "E'": { axis: 'y', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('y', 0) },
    'E2': { axis: 'y', angle: QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('y', 0) },

    // Whole cube rotations
    'x': { axis: 'x', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('x', -1).concat(getCubeletIndicesForFace('x', 0), getCubeletIndicesForFace('x', 1)) }, // All cubelets
    "x'": { axis: 'x', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('x', -1).concat(getCubeletIndicesForFace('x', 0), getCubeletIndicesForFace('x', 1)) },
    'x2': { axis: 'x', angle: -QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('x', -1).concat(getCubeletIndicesForFace('x', 0), getCubeletIndicesForFace('x', 1)) },

    'y': { axis: 'y', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('y', -1).concat(getCubeletIndicesForFace('y', 0), getCubeletIndicesForFace('y', 1)) }, // All cubelets
    "y'": { axis: 'y', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('y', -1).concat(getCubeletIndicesForFace('y', 0), getCubeletIndicesForFace('y', 1)) },
    'y2': { axis: 'y', angle: -QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('y', -1).concat(getCubeletIndicesForFace('y', 0), getCubeletIndicesForFace('y', 1)) },

    'z': { axis: 'z', angle: -QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('z', -1).concat(getCubeletIndicesForFace('z', 0), getCubeletIndicesForFace('z', 1)) }, // All cubelets
    "z'": { axis: 'z', angle: QUARTER_TURN, cubeletIndices: getCubeletIndicesForFace('z', -1).concat(getCubeletIndicesForFace('z', 0), getCubeletIndicesForFace('z', 1)) },
    'z2': { axis: 'z', angle: -QUARTER_TURN * 2, cubeletIndices: getCubeletIndicesForFace('z', -1).concat(getCubeletIndicesForFace('z', 0), getCubeletIndicesForFace('z', 1)) },
};
