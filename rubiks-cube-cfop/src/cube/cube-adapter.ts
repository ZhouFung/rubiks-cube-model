// cube-adapter.ts
// 封装 cubejs 的 TypeScript 适配层
import * as CubeModule from 'cubejs';
const Cube = (CubeModule as any).default || CubeModule;

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
        // 调试输出：当前魔方状态
        console.log('cubejs.move() 后状态:', this.getState());
    }

    /** 打乱魔方 */
    randomize() {
        this.cube.randomize();
        // 调试输出：打乱后的魔方状态
        console.log('cubejs.randomize() 后状态:', this.getState());
    }

    /** 还原魔方 */
    solve(): string[] {
        try {
            const result = this.cube.solve();
            if (!result) {
                // 调试输出：还原失败，cubejs 返回 null
                console.warn('cubejs.solve() 返回 null，无法还原当前状态:', this.getState());
                return [];
            }
            // 调试输出：还原公式
            console.log('cubejs.solve() 还原公式:', result);
            return result.split(' ');
        } catch (e) {
            // 调试输出：异常信息
            console.error('cubejs.solve() 异常:', e, '当前状态:', this.getState());
            return [];
        }
    }

    /** 重置魔方为初始状态 */
    reset() {
        this.cube = new Cube();
    }

    /** 获取六面颜色二维数组（每面9个块） */
    getFaceColors(): Record<FaceColor, string[]> {
        const state = this.getState();
        // cubejs 默认顺序：U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
        // faces 顺序与 cubejs 状态字符串一致
        if (state.length !== 54) {
            console.warn('魔方状态字符串长度异常:', state.length, state);
            // 返回空面，避免后续报错
            return {
                U: [], D: [], F: [], B: [], L: [], R: []
            };
        }
        const result: Record<FaceColor, string[]> = {
            U: state.slice(0, 9).split(''),
            R: state.slice(9, 18).split(''),
            F: state.slice(18, 27).split(''),
            D: state.slice(27, 36).split(''),
            L: state.slice(36, 45).split(''),
            B: state.slice(45, 54).split('')
        };
        return result;
    }
}
