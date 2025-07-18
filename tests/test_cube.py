import unittest
from cube.cube import Cube

class TestCube(unittest.TestCase):
    def test_cfop_cross(self):
        from view.plotly_cube import plot_cube
        cube = Cube(size=3)
        cube.scramble(20)
        plot_cube(cube, filename='cube_scrambled.html')
        cube.make_cross_cfop('U')
        plot_cube(cube, filename='cube_cross_cfop.html')
        self.assertTrue(cube.is_cross('U'))

    def test_color_counts_after_scramble(self):
        cube = Cube(size=3)
        
        # Get initial color counts for each face
        initial_color_counts = {}
        for face_name in cube.FACES:
            counts = {}
            for cubelet in cube.cubelets:
                if face_name in cubelet.colors:
                    color = cubelet.colors[face_name]
                    counts[color] = counts.get(color, 0) + 1
            initial_color_counts[face_name] = counts

        cube.scramble(50) # Scramble with more moves to ensure thorough mixing

        # Get color counts after scrambling
        scrambled_color_counts = {}
        for face_name in cube.FACES:
            counts = {}
            for cubelet in cube.cubelets:
                if face_name in cubelet.colors:
                    color = cubelet.colors[face_name]
                    counts[color] = counts.get(color, 0) + 1
            scrambled_color_counts[face_name] = counts
        
        # Assert that the color counts remain the same for each face
        for face_name in cube.FACES:
            self.assertEqual(initial_color_counts[face_name], scrambled_color_counts[face_name], f"Color counts mismatch on face {face_name}")

if __name__ == '__main__':
    unittest.main()