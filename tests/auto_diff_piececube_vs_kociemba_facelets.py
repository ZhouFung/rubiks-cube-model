// 文件已删除
"""
自动比对PieceCube与kociemba官方Cube模型每个单步旋转后的各面facelet分布和中心色，输出所有差异。
需已安装kociemba库。
"""
import sys
import importlib
sys.path.insert(0, '.')
from cube.piece_cube import PieceCube

try:
    kociemba = importlib.import_module('kociemba')
except Exception:
    print('请先安装kociemba库：pip install kociemba')
    sys.exit(1)

faces = 'URFDLB'
face_names = ['U', 'R', 'F', 'D', 'L', 'B']

def get_facelets(cube):
    state = cube.get_state()
    pos_map = {tuple(cubie['position']): cubie['colors'] for cubie in state}
    facelets = {}
    # U: y=2, x=0..2, z=0..2
    facelets['U'] = [[pos_map[(x,2,z)].get('U','X') for z in range(3)] for x in range(3)]
    # R: x=2, y=2..0, z=0..2
    facelets['R'] = [[pos_map[(2,y,z)].get('R','X') for z in range(3)] for y in range(2,-1,-1)]
    # F: z=2, y=2..0, x=0..2
    facelets['F'] = [[pos_map[(x,y,2)].get('F','X') for x in range(3)] for y in range(2,-1,-1)]
    # D: y=0, x=2..0, z=2..0
    facelets['D'] = [[pos_map[(x,0,z)].get('D','X') for z in range(2,-1,-1)] for x in range(2,-1,-1)]
    # L: x=0, y=2..0, z=2..0
    facelets['L'] = [[pos_map[(0,y,z)].get('L','X') for z in range(2,-1,-1)] for y in range(2,-1,-1)]
    # B: z=0, y=2..0, x=2..0
    facelets['B'] = [[pos_map[(x,y,0)].get('B','X') for x in range(2,-1,-1)] for y in range(2,-1,-1)]
    return facelets

def get_kociemba_facelets(cube):
    s = cube.to_kociemba_string()
    # kociemba的facelet顺序：URFDLB，每面9个，行优先
    faces = {}
    idx = 0
    for f in face_names:
        faces[f] = [[s[idx + i*3 + j] for j in range(3)] for i in range(3)]
        idx += 9
    return faces

def compare_facelets(f1, f2):
    diffs = []
    for f in face_names:
        for i in range(3):
            for j in range(3):
                if f1[f][i][j] != f2[f][i][j]:
                    diffs.append((f, i, j, f1[f][i][j], f2[f][i][j]))
    return diffs

def print_facelets(facelets):
    for f in face_names:
        print(f'-- {f} --')
        for row in facelets[f]:
            print(' '.join(row))
        print()

def print_centers(facelets):
    print('中心色:', ' '.join(facelets[f][1][1] for f in face_names))

for face in faces:
    for clockwise in [True, False]:
        cube = PieceCube()
        move = face + ('' if clockwise else "'")
        cube.rotate(face, clockwise)
        facelets = get_facelets(cube)
        k_facelets = get_kociemba_facelets(cube)
        diffs = compare_facelets(facelets, k_facelets)
        print(f'==== {move} 旋转后各面facelet分布差异 ===')
        if not diffs:
            print('与kociemba官方Cube完全一致！')
        else:
            for f, i, j, v1, v2 in diffs:
                print(f'{f}[{i},{j}]: PieceCube={v1}, kociemba={v2}')
        print('PieceCube中心色:', ' '.join(facelets[f][1][1] for f in face_names))
        print('kociemba中心色:', ' '.join(k_facelets[f][1][1] for f in face_names))
        print('-'*40)
