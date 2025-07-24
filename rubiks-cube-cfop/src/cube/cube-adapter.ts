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
        this.cube = Cube();
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
        this.cube = Cube();
    }
}
