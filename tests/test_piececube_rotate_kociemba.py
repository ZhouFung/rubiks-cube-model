// 文件已删除
import sys
from cube.piece_cube import PieceCube

# 只做一步旋转，输出kociemba字符串和is_solved判定
faces = 'URFDLB'
results = []
for face in faces:
    for clockwise in [True, False]:
        cube = PieceCube()
        cube.rotate(face, clockwise)
        s = cube.to_kociemba_string()
        solved = cube.is_solved()
        results.append((face, clockwise, s, solved))
        print(f'face={face}, clockwise={clockwise}, is_solved={solved}, kociemba_str={s}')
        # 检查kociemba能否接受
        try:
            import kociemba
            kociemba.solve(s)
            print(f'  [OK] kociemba accepted')
        except Exception as e:
            print(f'  [FAIL] kociemba error: {e}')
