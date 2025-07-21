from cube.piece_cube import  PieceCube

class BaseSolver:
    def __init__(self, cube: PieceCube):
        self.cube = cube

    def solve(self):
        raise NotImplementedError('请在子类中实现解法')

    def get_steps(self):
        # 返回解法步骤
        return []
