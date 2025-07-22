// 文件已删除
"""
自动化比对PieceCube与kociemba官方Cube模型的角块/棱块编号、朝向编码、facelet分配。
输出每个编号的facelet分配、朝向编码、与kociemba官方Cube模型的详细对比。
"""
import sys
import importlib
sys.path.insert(0, '.')
from cube.piece_cube import PieceCube, CORNER_POSITIONS, EDGE_POSITIONS, FACE_COLOR

# kociemba官方角块/棱块facelet顺序
KOCIEMBA_CORNER_POSITIONS = [
    ('U','R','F'), ('U','B','R'), ('U','L','B'), ('U','F','L'),
    ('D','F','R'), ('D','R','B'), ('D','B','L'), ('D','L','F')
]
KOCIEMBA_EDGE_POSITIONS = [
    ('U','R'), ('U','F'), ('U','L'), ('U','B'),
    ('F','R'), ('B','R'), ('B','L'), ('F','L'),
    ('D','R'), ('D','F'), ('D','L'), ('D','B')
]

print('==== 角块编号/朝向编码/facelet分配自动对比 ===')
for idx in range(8):
    for ori in range(3):
        # PieceCube分配
        faces = list(CORNER_POSITIONS[idx])
        for _ in range(ori):
            faces = [faces[2], faces[0], faces[1]]
        # kociemba官方分配
        k_faces = list(KOCIEMBA_CORNER_POSITIONS[idx])
        # 比较
        match = (faces == k_faces)
        print(f'角块编号={idx}, 朝向编码={ori}, PieceCube={faces}, kociemba={k_faces}, match={match}')
print('\n==== 棱块编号/朝向编码/facelet分配自动对比 ===')
for idx in range(12):
    for ori in range(2):
        faces = list(EDGE_POSITIONS[idx])
        if ori == 1:
            faces = faces[::-1]
        k_faces = list(KOCIEMBA_EDGE_POSITIONS[idx])
        match = (faces == k_faces)
        print(f'棱块编号={idx}, 朝向编码={ori}, PieceCube={faces}, kociemba={k_faces}, match={match}')
print('\n==== 角块/棱块编号与kociemba编号一致性 ===')
for idx in range(8):
    match = (CORNER_POSITIONS[idx] == KOCIEMBA_CORNER_POSITIONS[idx])
    print(f'角块编号={idx}, PieceCube={CORNER_POSITIONS[idx]}, kociemba={KOCIEMBA_CORNER_POSITIONS[idx]}, match={match}')
for idx in range(12):
    match = (EDGE_POSITIONS[idx] == KOCIEMBA_EDGE_POSITIONS[idx])
    print(f'棱块编号={idx}, PieceCube={EDGE_POSITIONS[idx]}, kociemba={KOCIEMBA_EDGE_POSITIONS[idx]}, match={match}')
