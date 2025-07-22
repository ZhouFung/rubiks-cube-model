// 文件已删除
"""
自动输出PieceCube每个单步旋转后的各面facelet分布与中心色，辅助定位facelet映射或中心色采集问题。
"""
import sys
sys.path.insert(0, '.')
from cube.piece_cube import PieceCube

faces = 'URFDLB'
face_names = ['U', 'R', 'F', 'D', 'L', 'B']

# 采集每个面的facelet分布
# U: y==2, x=0..2, z=0..2
# R: x==2, z=0..2, y=2..0
# F: z==2, x=0..2, y=2..0
# D: y==0, x=2..0, z=0..2
# L: x==0, z=2..0, y=2..0
# B: z==0, x=2..0, y=2..0

def get_facelets(cube):
    state = cube.get_state()
    pos_map = {tuple(cubie['position']): cubie['colors'] for cubie in state}
    facelets = {}
    # U
    facelets['U'] = [[pos_map[(x,2,z)].get('U','X') for x in range(3)] for z in range(3)]
    # R
    facelets['R'] = [[pos_map[(2,y,z)].get('R','X') for z in range(3)] for y in range(2,-1,-1)]
    # F
    facelets['F'] = [[pos_map[(x,y,2)].get('F','X') for x in range(3)] for y in range(2,-1,-1)]
    # D
    facelets['D'] = [[pos_map[(x,0,z)].get('D','X') for x in range(2,-1,-1)] for z in range(3)]
    # L
    facelets['L'] = [[pos_map[(0,y,z)].get('L','X') for z in range(2,-1,-1)] for y in range(2,-1,-1)]
    # B
    facelets['B'] = [[pos_map[(x,y,0)].get('B','X') for x in range(2,-1,-1)] for y in range(2,-1,-1)]
    return facelets

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
        print(f'==== {move} 旋转后各面facelet分布 ===')
        print_facelets(facelets)
        print_centers(facelets)
        print('-'*40)
