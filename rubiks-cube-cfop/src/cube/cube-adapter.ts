// cube-adapter.ts
// 封装 cubejs 的 TypeScript 适配层
import Cube from 'cubejs';

export type FaceColor = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

export interface CubeState {
    stateString: string; // 54 字符魔方状态
}

export class CubeAdapter {
    private cube: any;

    constructor() {
        this.cube = new Cube();
    }

    /** 获取当前魔方状态字符串 */
    getState(): string {
        return this.cube.asString();
    }

    /** 执行魔方操作（如 "R U R' U'"） */
    move(sequence: string) {
        this.cube.move(sequence);
    }

    /** 打乱魔方 */
    randomize() {
        this.cube.randomize();
    }

    /** 还原魔方 */
    solve(): string[] {
        return this.cube.solve().split(' ');
    }

    /** 重置魔方为初始状态 */
    reset() {
        this.cube = new Cube();
    }

    /** 获取六面颜色二维数组（每面9个块） */
    getFaceColors(): Record<FaceColor, string[]> {
        const state = this.getState();
        // U D F B L R 顺序，每面9个块
        const faces: FaceColor[] = ['U', 'R', 'F', 'D', 'L', 'B'];
        const result: Record<FaceColor, string[]> = {
            U: [], D: [], F: [], B: [], L: [], R: []
        };
        // cubejs 默认顺序：U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            result[face] = state.slice(i * 9, (i + 1) * 9).split('');
        }
        return result;
    }
}
