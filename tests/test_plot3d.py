import unittest
from cube.cube import Cube
from view.plot3d import plot_cube

class TestPlot3D(unittest.TestCase):
    def test_plot_cube(self):
        cube = Cube(size=3)
        # 打乱魔方后可视化
        cube.scramble(3)
        # 只测试不抛异常即可
        try:
            plot_cube(cube)
        except Exception as e:
            self.fail(f"plot_cube raised Exception: {e}")

if __name__ == '__main__':
    unittest.main()
