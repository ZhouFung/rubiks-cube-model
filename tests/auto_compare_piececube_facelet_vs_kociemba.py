// 文件已删除
# 自动对比 PieceCube 与 kociemba 官方 Cube 的 facelet 字符串，辅助定位贴纸色分布/中心色顺序等边界 bug
import sys
import os
import random
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from cube.piece_cube import PieceCube
from tests.kociemba_cube import Cube as KociembaCube

def main():
    for i in range(10):
        pc = PieceCube()
        moves = pc.scramble(20, avoid_parity=True, kociemba_check=False)
        pc_str = pc.to_kociemba_string()
        # 构造 kociemba 官方 Cube
        kc = KociembaCube()
        for move in moves:
            face = move[0]
            clockwise = not (len(move) > 1 and move[1] == "'")
            kc.move(face + ('' if clockwise else "'"))
        kc_str = kc.to_kociemba_string() if hasattr(kc, 'to_kociemba_string') else None
        if kc_str is None:
            print('KociembaCube 无法获取 facelet 字符串')
            continue
        print(f'--- scramble {i+1} ---')
        print('moves:', moves)
        print('PieceCube:', pc_str)
        print('KociembaCube:', kc_str)
        print('equal:', pc_str == kc_str)
        # 输出差异位置
        if pc_str != kc_str:
            for idx, (a, b) in enumerate(zip(pc_str, kc_str)):
                if a != b:
                    print(f'  diff at {idx}: PieceCube={a}, KociembaCube={b}')
        print('---')

if __name__ == '__main__':
    main()
