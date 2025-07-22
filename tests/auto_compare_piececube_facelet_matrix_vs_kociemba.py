// 文件已删除
# 自动对比 PieceCube 与 kociemba 官方 Cube 的每面 3x3 色块矩阵，辅助定位贴纸采集顺序/中心色等边界 bug
import sys
import os
import random
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from cube.piece_cube import PieceCube
from tests.kociemba_cube import Cube as KociembaCube

def face_matrix_from_string(s):
    # s: 54 字符串，URFDLB顺序，行优先
    faces = {}
    idx = 0
    for f in 'URFDLB':
        mat = []
        for i in range(3):
            mat.append(list(s[idx:idx+3]))
            idx += 3
        faces[f] = mat
    return faces

def print_face_matrix(faces, label):
    print(f'--- {label} ---')
    for f in 'URFDLB':
        print(f'{f}:')
        for row in faces[f]:
            print('  ' + ' '.join(row))
    print()

def main():
    for i in range(3):
        pc = PieceCube()
        moves = pc.scramble(20, avoid_parity=True, kociemba_check=False)
        pc_str = pc.to_kociemba_string()
        kc = KociembaCube()
        for move in moves:
            face = move[0]
            clockwise = not (len(move) > 1 and move[1] == "'")
            kc.move(face + ('' if clockwise else "'"))
        kc_str = kc.to_kociemba_string() if hasattr(kc, 'to_kociemba_string') else None
        if kc_str is None:
            print('KociembaCube 无法获取 facelet 字符串')
            continue
        print(f'=== scramble {i+1} ===')
        print('moves:', moves)
        pc_faces = face_matrix_from_string(pc_str)
        kc_faces = face_matrix_from_string(kc_str)
        print_face_matrix(pc_faces, 'PieceCube')
        print_face_matrix(kc_faces, 'KociembaCube')
        # 输出每面差异
        for f in 'URFDLB':
            print(f'Diff {f}:')
            for r in range(3):
                for c in range(3):
                    a = pc_faces[f][r][c]
                    b = kc_faces[f][r][c]
                    if a != b:
                        print(f'  {f}[{r}][{c}]: PieceCube={a}, KociembaCube={b}')
        print('===\n')

if __name__ == '__main__':
    main()
