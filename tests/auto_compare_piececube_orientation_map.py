// 文件已删除

# 自动对比PieceCube与kociemba官方Cube角块/棱块朝向变换的详细脚本
# 重点：对每个面旋转，所有角块/棱块的朝向变换与编号变换，逐一与kociemba官方Cube对比

# 保证本地import可用
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import sys
from copy import deepcopy



try:
    from tests.kociemba_cube import Cube as KociembaCube
except ImportError:
    from kociemba_cube import Cube as KociembaCube


from cube.piece_cube import PieceCube

faces = 'URFDLB'
def print_corner_state(cube):
    for i, (pos, ori) in enumerate(cube.corners):
        print(f'  角{i}: pos={pos}, ori={ori}')
def print_edge_state(cube):
    for i, (pos, ori) in enumerate(cube.edges):
        print(f'  棱{i}: pos={pos}, ori={ori}')



def get_kociemba_cubestate():
    c = KociembaCube()
    corners = [(c.cp[i], c.co[i]) for i in range(8)]
    edges = [(c.ep[i], c.eo[i]) for i in range(12)]
    return corners, edges

def main():
    print('==== 角块/棱块朝向变换详细对比 ===')
    for face in faces:
        for clockwise in [True, False]:
            move = face + ("" if clockwise else "'")
            print(f'-- 旋转: {move} --')
            # PieceCube
            pc = PieceCube()
            pc.rotate(face, clockwise)
            print('PieceCube:')
            print_corner_state(pc)
            print_edge_state(pc)
            # kociemba官方Cube
            kc_cube = KociembaCube()
            kc_cube.move(face + ("" if clockwise else "'"))
            print('kociemba.Cube:')
            print('  角:')
            for i in range(8):
                print(f'    {i}: pos={kc_cube.cp[i]}, ori={kc_cube.co[i]}')
            print('  棱:')
            for i in range(12):
                print(f'    {i}: pos={kc_cube.ep[i]}, ori={kc_cube.eo[i]}')
            # 对比
            pc_corners = pc.corners
            kc_corners = [(kc_cube.cp[i], kc_cube.co[i]) for i in range(8)]
            pc_edges = pc.edges
            kc_edges = [(kc_cube.ep[i], kc_cube.eo[i]) for i in range(12)]
            corners_match = pc_corners == kc_corners
            edges_match = pc_edges == kc_edges
            print(f'角块完全一致: {corners_match}')
            print(f'棱块完全一致: {edges_match}')
            if not corners_match:
                print('角块差异:')
                for i in range(8):
                    if pc_corners[i] != kc_corners[i]:
                        print(f'  idx={i}: PieceCube={pc_corners[i]}, kociemba={kc_corners[i]}')
            if not edges_match:
                print('棱块差异:')
                for i in range(12):
                    if pc_edges[i] != kc_edges[i]:
                        print(f'  idx={i}: PieceCube={pc_edges[i]}, kociemba={kc_edges[i]}')
            print('-'*40)

if __name__ == '__main__':
    main()
