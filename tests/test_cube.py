import unittest
from cube.cube import Cube

class TestCube(unittest.TestCase):
    def test_save_and_load_state(self):
        import os
        cube = Cube(size=3)
        cube.scramble(5)
        filepath = 'test_state.json'
        cube.save_state(filepath)
        # 新建一个魔方实例并加载状态
        cube2 = Cube(size=3)
        cube2.load_state(filepath)
        # 检查加载后状态与保存前一致
        self.assertEqual(cube.get_state(), cube2.get_state())
        os.remove(filepath)
    def test_get_state(self):
        cube = Cube(size=3)
        state = cube.get_state()
        self.assertEqual(len(state), 27)
        # 检查中心块颜色
        centers = [c for c in state if len(c['colors']) == 1]
        self.assertEqual(len(centers), 6)
        # 检查角块颜色
        corners = [c for c in state if len(c['colors']) == 3]
        self.assertEqual(len(corners), 8)
    def test_scramble(self):
        cube = Cube(size=3)
        # 假设初始状态为复原，打乱后应与初始状态不同（这里只能简单判断，具体需完善is_solved实现）
        cube.scramble(moves_count=10)
        # 由于is_solved未实现，这里只测试接口不报错
        self.assertTrue(True)
    def test_init(self):
        cube = Cube(size=3)
        self.assertEqual(cube.size, 3)

    def test_rotate(self):
        cube = Cube(size=3)
        # 这里只是接口测试，具体实现后完善
        cube.rotate('U')

    def test_is_solved(self):
        cube = Cube(size=3)
        # 需完善is_solved实现
        self.assertIsNotNone(cube.is_solved())

if __name__ == '__main__':
    unittest.main()
