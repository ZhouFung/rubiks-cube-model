import unittest
from cube.piece_cube import PieceCube

class TestPieceCubeSolved(unittest.TestCase):
    def test_piececube_solved_state(self):
        cube = PieceCube()
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
        self.assertEqual(face_counts['F'].get('G', 0), size*size)
        self.assertEqual(face_counts['B'].get('B', 0), size*size)
        self.assertEqual(face_counts['L'].get('O', 0), size*size)
        self.assertEqual(face_counts['R'].get('R', 0), size*size)

if __name__ == '__main__':
    unittest.main()
