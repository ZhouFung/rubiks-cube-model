import * as CubeModule from 'cubejs';
const Cube = (CubeModule as any).default || CubeModule;

export type FaceColor = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

// 魔方复原结构体类型定义（如有需要）
export interface SolvedCube {
    cross: string;
    f2l: string[];
    oll: string;
    pll: string;
}

export class CubeAdapter {
    private cube: any;

    constructor() {
        if (typeof Cube.initSolver === 'function') {
            Cube.initSolver();
        }
        this.cube = new Cube();
    }

    /** 获取当前魔方状态，返回54字符字符串 */
    getState(): string {
        const state = this.cube.asString();
        if (state.length !== 54) {
            console.error('魔方状态无效！长度:', state.length, '状态:', state);
            // 自动重置魔方，防止后续错误
            this.reset();
            // 返回复原后的状态
            return this.cube.asString();
        }
        return state;
    }

    /** 执行一步或一组魔方操作 */
    move(sequence: string) {
        this.cube.move(sequence);
    }

    /**
     * 打乱魔方状态
     * 推荐使用 Cube.random() 生成可解的随机魔方实例
     * 不建议用 this.cube.randomize()
     */
    randomize() {
        if (typeof this.cube.randomize === 'function') {
            this.cube.randomize();
        } else if (typeof Cube.random === 'function') {
            this.cube = Cube.random();
        } else {
            // fallback: 重新 new 一个实例
            this.cube = new Cube();
        }
        console.log('打乱后状态:', this.getState());
    }

    /** 解整个魔方，返回所有步骤（字符串数组） */
    solve(): string[] | null {
        try {
            if (!this.cube || typeof this.cube.solve !== 'function') {
                console.error('cube.solve 方法不存在，cube:', this.cube);
                return null;
            }
            const result = this.cube.solve();
            if (typeof result === 'string' && result.length > 0) {
                return result.split(' ');
            }
            if (typeof result === 'string' && result.length === 0) {
                console.warn('魔方已复原或无解步骤');
            }
            return []; // 已复原或无解
        } catch (e) {
            console.error('解魔方出错:', e, '当前状态:', this.getState());
            return null; // 表示发生错误
        }
    }

    /** 只解底部十字，返回步骤 */
    solveCross(): string[] | null {
        try {
            const state = this.getState();
            console.log('[调试] 当前魔方状态:', state);
            const solution = Cube.solve(state, 'cross');
            console.log('[调试] 解底部十字返回:', solution);
            return solution ? solution.split(' ') : [];
        } catch (e) {
            console.error('[调试] 解底部十字出错:', e, '当前状态:', this.getState());
            return null;
        }
    }

    /** 解F2L，返回步骤 */
    solveF2L(): string[] | null {
        try {
            const state = this.getState();
            console.log('[调试] 当前魔方状态:', state);
            const solution = Cube.solve(state, 'f2l');
            console.log('[调试] 解F2L返回:', solution);
            return solution ? solution.split(' ') : [];
        } catch (e) {
            console.error('[调试] 解F2L出错:', e, '当前状态:', this.getState());
            return null;
        }
    }

    /** 解顶层朝向（OLL），返回步骤 */
    solveOLL(): string[] | null {
        try {
            const state = this.getState();
            console.log('[调试] 当前魔方状态:', state);
            const solution = Cube.solve(state, 'oll');
            console.log('[调试] 解OLL返回:', solution);
            return solution ? solution.split(' ') : [];
        } catch (e) {
            console.error('[调试] 解OLL出错:', e, '当前状态:', this.getState());
            return null;
        }
    }

    /** 解顶层排列（PLL），返回步骤 */
    solvePLL(): string[] | null {
        try {
            const state = this.getState();
            console.log('[调试] 当前魔方状态:', state);
            const solution = Cube.solve(state, 'pll');
            console.log('[调试] 解PLL返回:', solution);
            return solution ? solution.split(' ') : [];
        } catch (e) {
            console.error('[调试] 解PLL出错:', e, '当前状态:', this.getState());
            return null;
        }
    }


    /** 魔方复原，回到初始状态 */
    reset() {
        this.cube = new Cube();
    }

    /**
     * 获取每个面的颜色，返回字符串数组对象
     * 每个数组顺序与 cubejs 的字符串表示一致
     */
    getFaceColors(): Record<FaceColor, string[]> {
        const state = this.getState();
        // cubejs 面顺序: U, R, F, D, L, B
        if (state.length !== 54) {
            console.warn('魔方状态字符串长度无效:', state.length, state);
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

// 根据 (x, y, z) 坐标获取小块索引
// 假设小块索引为 0~26，x,y,z 均为 -1,0,1
// 索引计算: x + y*3 + z*9 (x,y,z 映射到 0,1,2)
function getCubeletIndex(x: number, y: number, z: number): number {
    // Map -1, 0, 1 to 0, 1, 2 for array indexing
    const mapCoord = (coord: number) => coord + 1;
    return mapCoord(x) + mapCoord(y) * 3 + mapCoord(z) * 9;
}

// 获取某一面/层所有小块索引
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

// 每一步操作的动画细节定义
interface AnimationDetails {
    axis: 'x' | 'y' | 'z';
    angle: number; // in radians
    cubeletIndices: number[];
}

// 单次转动角度（90度）
const QUARTER_TURN = Math.PI / 2;

// 操作与动画细节的映射表
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
