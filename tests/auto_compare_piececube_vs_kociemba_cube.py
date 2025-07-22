// 文件已删除
# 自动对比 PieceCube 与 kociemba 官方 Cube 块编号/朝向/facelet 兼容性
# 重点输出打乱后 cp, co, ep, eo 及 kociemba 校验结果，辅助定位剩余 bug

import sys
import os
import random
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from cube.piece_cube import PieceCube
from tests.kociemba_cube import Cube as KociembaCube

def print_state(title, cp, co, ep, eo):
    print(f'--- {title} ---')
    print('cp:', cp)
    print('co:', co)
    print('ep:', ep)
    print('eo:', eo)

def piececube_to_cubestate(cube: PieceCube):
    cp = [pos for (pos, ori) in cube.corners]
    co = [ori for (pos, ori) in cube.corners]
    ep = [pos for (pos, ori) in cube.edges]
    eo = [ori for (pos, ori) in cube.edges]
    return cp, co, ep, eo

def main():
    for i in range(10):
        pc = PieceCube()
        moves = pc.scramble(20, avoid_parity=True, kociemba_check=False)
        cp, co, ep, eo = piececube_to_cubestate(pc)
        print_state(f'PieceCube scramble {i+1}', cp, co, ep, eo)
        # 构造 kociemba 官方 Cube
        kc = KociembaCube()
        for move in moves:
            face = move[0]
            clockwise = not (len(move) > 1 and move[1] == "'")
            kc.move(face + ('' if clockwise else "'"))
        print_state(f'KociembaCube scramble {i+1}', kc.cp, kc.co, kc.ep, kc.eo)
        # 检查是否完全一致
        print('cp_equal:', cp == kc.cp)
        print('co_equal:', co == kc.co)
        print('ep_equal:', ep == kc.ep)
        print('eo_equal:', eo == kc.eo)
        print('---')

if __name__ == '__main__':
    main()
