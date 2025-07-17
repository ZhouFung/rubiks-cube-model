from cube.cube import Cube
from solver.base_solver import BaseSolver
from tutorial.tutorial import Tutorial, TutorialStep

if __name__ == '__main__':
    cube = Cube(size=3)
    print('魔方初始化完成')
    # 打乱魔方
    cube.scramble(moves_count=20)
    print('魔方已打乱')
    # 示例：旋转、求解、教学等
