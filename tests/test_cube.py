import unittest
from cube.cube import Cube

class TestCube(unittest.TestCase):
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
