from cube.kociemba_cube import Cube
from view.plotly_cube import plot_cube
from tutorial.cfop_cross import cfop_cross_solver, is_cross_solved
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
    # 已废弃
    pass

def main():
    cube = Cube()
    plot_cube(cube, title="Solved Cube", filename="cube_solved.html")

    scramble = random_scramble(20)
    apply_moves(cube, scramble)
    print("Scramble:", ' '.join(scramble))
    plot_cube(cube, title="Scrambled Cube", filename="cube_scrambled.html")

    cross_steps = cfop_cross_solver(cube, max_depth=7)
    print("Cross solution:", ' '.join(cross_steps))
    for mv in cross_steps:
        cube.move(mv)
    plot_cube(cube, title="After Cross", filename="cube_cross_cfop.html")
    print("Is cross solved?", is_cross_solved(cube))

if __name__ == '__main__':
    main()
