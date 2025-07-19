
import unittest
from cube.core import Cube
from view.plotly_cube import plot_cube


class TestCubeAPI(unittest.TestCase):
    def test_composite_rotations(self):
        """测试复合旋转序列后魔方状态与预期一致。"""
        cube = Cube()
        # U R U' R' 应该只影响部分块，最后回到原状
        original = cube.get_state()
        cube.rotate('U', True)
        cube.rotate('R', True)
        cube.rotate('U', False)
        cube.rotate('R', False)
        # 只要实现无bug，魔方状态应不同于初始，但块数不变
        self.assertEqual(len(cube.get_state()), cube.size**3)
        # 再做逆序操作应回到原状
        cube.rotate('R', True)
        cube.rotate('U', True)
        cube.rotate('R', False)
        cube.rotate('U', False)
        self.assertEqual(cube.get_state(), original)

    def test_four_rotations_restore(self):
        """同一面连续旋转4次应回到原状。"""
        cube = Cube()
        original = cube.get_state()
        for _ in range(4):
            cube.rotate('F', True)
        self.assertEqual(cube.get_state(), original)

    def test_scramble_and_reverse(self):
        """随机打乱后按逆序逆向旋转应回到复原状态。"""
        cube = Cube()
        original = cube.get_state()
        seq = cube.scramble(8)
        # 逆序还原
        for move in reversed(seq):
            face = move[0]
            clockwise = not (len(move) > 1 and move[1] == "'")
            cube.rotate(face, not clockwise)
        self.assertEqual(cube.get_state(), original)

    def test_2x2_cube(self):
        """测试2阶魔方的支持和旋转正确性。"""
        cube = Cube(size=2)
        self.assertTrue(cube.is_solved())
        cube.rotate('U', True)
        self.assertFalse(cube.is_solved())
        for _ in range(3):
            cube.rotate('U', True)
        self.assertTrue(cube.is_solved())
    def test_single_rotations(self):
        """测试每个面旋转一次后，外层贴纸颜色分布物理正确。"""
        cube = Cube()
        size = cube.size
        faces = ['U', 'D', 'F', 'B', 'L', 'R']
        for face in faces:
            cube = Cube()  # 每次新建魔方
            cube.rotate(face, True)
            state = cube.get_state()
            face_counts = {f: {} for f in faces}
            for cubie in state:
                x, y, z = cubie['position']
                for f in faces:
                    if (f == 'U' and y == size-1) or (f == 'D' and y == 0) or \
                       (f == 'F' and z == size-1) or (f == 'B' and z == 0) or \
                       (f == 'L' and x == 0) or (f == 'R' and x == size-1):
                        v = cubie['colors'].get(f, None)
                        if v is not None:
                            face_counts[f][v] = face_counts[f].get(v, 0) + 1
            for f in faces:
                total = sum(face_counts[f].values())
                self.assertEqual(total, size*size)
                # 不应出现NONE色
                self.assertNotIn('NONE', face_counts[f])

    def test_solved_state(self):
        cube = Cube()
        state = cube.get_state()
        face_counts = {face: {} for face in ['U','D','F','B','L','R']}
        size = cube.size
        for cubie in state:
            x, y, z = cubie['position']
            for face, v in cubie['colors'].items():
                if (face == 'U' and y == size-1) or (face == 'D' and y == 0) or \
                   (face == 'F' and z == size-1) or (face == 'B' and z == 0) or \
                   (face == 'L' and x == 0) or (face == 'R' and x == size-1):
                    face_counts[face][v] = face_counts[face].get(v, 0) + 1
        self.assertEqual(face_counts['U'].get('W', 0), size*size)
        self.assertEqual(face_counts['D'].get('Y', 0), size*size)
        self.assertEqual(face_counts['F'].get('R', 0), size*size)
        self.assertEqual(face_counts['B'].get('O', 0), size*size)
        self.assertEqual(face_counts['L'].get('B', 0), size*size)
        self.assertEqual(face_counts['R'].get('G', 0), size*size)
        plot_cube(cube, title="Solved Cube", filename="test_cube_solved.html")

    def test_scramble_and_rotate(self):
        cube = Cube()
        scramble_seq = cube.scramble(10)
        self.assertEqual(len(scramble_seq), 10)
        state = cube.get_state()
        self.assertEqual(len(state), cube.size**3)
        cube.rotate('U', True)
        state2 = cube.get_state()
        self.assertEqual(len(state2), cube.size**3)
        plot_cube(cube, title="Scrambled Cube", filename="test_cube_scrambled.html")

if __name__ == '__main__':
    unittest.main()
