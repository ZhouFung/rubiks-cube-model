// 文件已删除
from cube.piece_cube import PieceCube, CORNER_POSITIONS, EDGE_POSITIONS

print('==== 角块编号与朝向编码对比 ===')
cube = PieceCube()
for idx, (pos, ori) in enumerate(cube.corners):
    faces = list(CORNER_POSITIONS[pos])
    for o in range(3):
        # 物理朝向采集
        f = faces[:]
        for _ in range(o):
            f = [f[2], f[0], f[1]]
        print(f'角块编号={idx}, 物理编号={pos}, 朝向编码={o}, 朝向分配={f}')

print('\n==== 棱块编号与朝向编码对比 ===')
for idx, (pos, ori) in enumerate(cube.edges):
    faces = list(EDGE_POSITIONS[pos])
    for o in range(2):
        f = faces[::-1] if o == 1 else faces[:]
        print(f'棱块编号={idx}, 物理编号={pos}, 朝向编码={o}, 朝向分配={f}')
