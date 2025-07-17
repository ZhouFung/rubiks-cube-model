import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from cube.cube import Cube
from view.plot3d import plot_cube

if __name__ == '__main__':
    cube = Cube(size=3)
    # 保存打乱前的状态
    cube.save_state('before_scramble.json')
    cube.scramble(20)
    # 保存打乱后的状态
    cube.save_state('after_scramble.json')
    plot_cube(cube)
