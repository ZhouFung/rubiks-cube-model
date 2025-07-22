from cube.kociemba_cube import Cube
from view.plotly_cube import plot_cube
import random

# 随机打乱公式生成器
MOVES = ["U", "D", "F", "B", "L", "R"]
SUFFIX = ["", "'", "2"]
def random_scramble(n=20):
    seq = []
    last = None
    for _ in range(n):
        m = random.choice(MOVES)
        while m == last:
            m = random.choice(MOVES)
        last = m
        mv = m + random.choice(SUFFIX)
        seq.append(mv)
    return seq

def apply_moves(cube, moves):
    for mv in moves:
        cube.move(mv)

def cross_solver_stub(cube):
    # 这里只做演示，返回空解（实际可用cfop-cross搜索器替换）
    return []

def main():
    cube = Cube()
    plot_cube(cube, title="Solved Cube", filename="cube_solved.html")

    scramble = random_scramble(20)
    apply_moves(cube, scramble)
    print("Scramble:", ' '.join(scramble))
    plot_cube(cube, title="Scrambled Cube", filename="cube_scrambled.html")

    cross_steps = cross_solver_stub(cube)
    print("Cross solution:", ' '.join(cross_steps))
    for mv in cross_steps:
        cube.move(mv)
    plot_cube(cube, title="After Cross", filename="cube_cross_cfop.html")

if __name__ == '__main__':
    main()
