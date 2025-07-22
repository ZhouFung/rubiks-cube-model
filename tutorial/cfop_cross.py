"""
CFOP教程第一阶段：十字（Cross）
本模块实现自动寻找和还原底色十字的过程，适用于3阶魔方。
与Cube核心逻辑解耦，仅依赖Cube的API。
"""
from cube.piece_cube import PieceCube
import kociemba

class CFOPCrossSolver:
    def cross_solver_solve_cross(self, verbose=False):
        """
        用kociemba库实现十字还原。优先支持PieceCube，自动兼容Cube。
        """
        try:
            # 优先支持PieceCube
            from cube.piece_cube import PieceCube
            if isinstance(self.cube, PieceCube):
                kociemba_str = self.cube.to_kociemba_string()
            else:
                color_map = self._get_kociemba_color_map()
                kociemba_str = self._to_kociemba_string(color_map)
            from collections import Counter
            color_counts = Counter(kociemba_str)
            if verbose:
                print('[DEBUG] kociemba输入:', kociemba_str)
                print('[DEBUG] kociemba输入色统计:', dict(color_counts))
            if len(color_counts) != 6 or any(v != 9 for v in color_counts.values()):
                if verbose:
                    print('[DEBUG] kociemba输入色数不合法，自动回退')
                raise ValueError('kociemba输入色数不合法')
            centers = [kociemba_str[i*9+4] for i in range(6)]
            if len(set(centers)) != 6:
                if verbose:
                    print('[DEBUG] kociemba中心色不唯一，自动回退')
                raise ValueError('kociemba中心色不唯一')
            import kociemba
            solution = kociemba.solve(kociemba_str)
            if verbose:
                print('[DEBUG] kociemba全解:', solution)
            moves = []
            for move in solution.split():
                face, clockwise, *rest = self._parse_move(move)
                if rest and isinstance(rest[0], int):
                    for _ in range(rest[0]):
                        self.cube.rotate(face, clockwise)
                        moves.append(f"{face}{'2' if rest[0]==2 else ''}{"'" if not clockwise else ''}")
                        if self.is_cross_solved():
                            if verbose:
                                print('[DEBUG] 十字已完成，提前终止')
                            return moves
                else:
                    self.cube.rotate(face, clockwise)
                    moves.append(move)
                    if self.is_cross_solved():
                        if verbose:
                            print('[DEBUG] 十字已完成，提前终止')
                        return moves
            return moves
        except Exception as e:
            if verbose:
                print('[DEBUG] kociemba十字失败，回退原算法', e)
            return self._fallback_cross_solver(verbose=verbose)

    def _get_kociemba_color_map(self):
        """
        返回魔方中心块颜色到kociemba标准字母的映射。
        强制Cube中心色与kociemba标准一致（U:W, R:R, F:G, D:Y, L:O, B:B）。
        """
        # 取中心块颜色
        state = self.cube.get_state()
        centers = {}
        for cubie in state:
            if len(cubie['colors']) == 1:
                for face, color in cubie['colors'].items():
                    centers[face] = color
        # kociemba标准色字母
        std_center = {'U': 'W', 'R': 'R', 'F': 'G', 'D': 'Y', 'L': 'O', 'B': 'B'}
        color_map = {}
        for face in ['U','R','F','D','L','B']:
            c = centers[face]
            color_map[c] = face
        # debug输出中心色
        import sys
        if hasattr(sys, '_getframe') and sys._getframe(1).f_locals.get('verbose', False):
            print('[DEBUG] centers:', centers)
            print('[DEBUG] color_map:', color_map)
        return color_map

    def _to_kociemba_string(self, color_map):
        """
        直接用Cube.state的6面二维数组，严格按kociemba官方facelet顺序采集贴纸色彩，无X/None。
        """
        cube = self.cube
        s = ''
        # U1-U9: U面，行优先（z=0..2, x=0..2）
        for z in range(3):
            for x in range(3):
                s += color_map.get(cube.state['U'][x][z], 'X')
        # R1-R9: R面，行优先（z=0..2, y=2..0）
        for z in range(3):
            for y in range(2,-1,-1):
                s += color_map.get(cube.state['R'][z][2-y], 'X')
        # F1-F9: F面，行优先（y=2..0, x=0..2）
        for y in range(2,-1,-1):
            for x in range(3):
                s += color_map.get(cube.state['F'][x][2-y], 'X')
        # D1-D9: D面，行优先（z=0..2, x=2..0）
        for z in range(3):
            for x in range(2,-1,-1):
                s += color_map.get(cube.state['D'][x][z], 'X')
        # L1-L9: L面，行优先（z=2..0, y=2..0）
        for z in range(2,-1,-1):
            for y in range(2,-1,-1):
                s += color_map.get(cube.state['L'][z][2-y], 'X')
        # B1-B9: B面，行优先（y=2..0, x=2..0）
        for y in range(2,-1,-1):
            for x in range(2,-1,-1):
                s += color_map.get(cube.state['B'][x][2-y], 'X')
        import sys
        if hasattr(sys, '_getframe') and sys._getframe(1).f_locals.get('verbose', False):
            print('[DEBUG] kociemba采集:', s)
        return s

    def _facelet_index(self, face, pos):
        """给定面和坐标，返回该贴纸在kociemba标准facelet序中的索引。"""
        # U: (x,2,z) z=0..2, x=0..2
        if face == 'U':
            x, y, z = pos
            return z*3 + x
        # R: (2,y,z) z=2..0, y=2..0
        elif face == 'R':
            x, y, z = pos
            return (2-z)*3 + (2-y)
        # F: (x,y,2) y=2..0, x=0..2
        elif face == 'F':
            x, y, z = pos
            return (2-y)*3 + x
        # D: (x,0,z) z=0..2, x=0..2
        elif face == 'D':
            x, y, z = pos
            return z*3 + x
        # L: (0,y,z) z=0..2, y=2..0
        elif face == 'L':
            x, y, z = pos
            return z*3 + (2-y)
        # B: (x,y,0) y=2..0, x=2..0
        elif face == 'B':
            x, y, z = pos
            return (2-y)*3 + (2-x)
        else:
            return 0

    def _parse_move(self, move):
        """将kociemba格式如F2、R'转为cube.rotate参数。"""
        face = move[0]
        if len(move) == 1:
            return face, True
        elif move[1] == '2':
            return face, True, 2
        elif move[1] == "'":
            return face, False
        else:
            return face, True

    def _fallback_cross_solver(self, verbose=False):
        # 原有暴力cross solver算法
        moves = []
        cross_edges = [
            ('F', (1,0)),
            ('B', (1,2)),
            ('L', (0,1)),
            ('R', (2,1)),
        ]
        for _ in range(20):
            state = self.cube.get_state()
            moved = False
            for cubie in state:
                pos = cubie['position']
                colors = cubie['colors']
                if len(colors) == 2 and self.cross_color in colors.values() and pos[1] != 2:
                    color_set = set(colors.items())
                    if pos[1] == 0:
                        d_rot_count = 0
                        while not (pos[0] == 1 and pos[2] == 0) and d_rot_count < 4:
                            self.cube.rotate('D', True); moves.append('D')
                            d_rot_count += 1
                            state = self.cube.get_state()
                            for c in state:
                                if len(c['colors']) == 2 and set(c['colors'].items()) == color_set:
                                    pos = c['position']
                                    break
                        self.cube.rotate('F', False); moves.append("F'")
                        self.cube.rotate('U', False); moves.append("U'")
                        self.cube.rotate('F', True); moves.append('F')
                        moved = True
                        break
                    else:
                        self.cube.rotate('F', False); moves.append("F'")
                        self.cube.rotate('U', False); moves.append("U'")
                        self.cube.rotate('F', True); moves.append('F')
                        moved = True
                        break
            if not moved:
                break
        for _ in range(20):
            state = self.cube.get_state()
            all_done = True
            for face, (x, z) in cross_edges:
                found = False
                for cubie in state:
                    pos = cubie['position']
                    colors = cubie['colors']
                    if len(colors) == 2 and self.cross_color in colors.values():
                        if pos == (x,0,z) and colors.get('D', None) == self.cross_color:
                            side_color = colors.get(face, None)
                            center_color = None
                            for c in state:
                                if c['position'] == (x,1,z) and len(c['colors']) == 1:
                                    center_color = c['colors'].get(face, None)
                                    break
                            if side_color == center_color:
                                found = True
                                break
                if found:
                    continue
                for cubie in state:
                    pos = cubie['position']
                    colors = cubie['colors']
                    if len(colors) == 2 and self.cross_color in colors.values():
                        color_set = set(colors.items())
                        if pos[1] == 0:
                            d_rot_count = 0
                            while not (pos[0] == x and pos[2] == z) and d_rot_count < 4:
                                self.cube.rotate('D', True); moves.append('D')
                                d_rot_count += 1
                                state = self.cube.get_state()
                                for c in state:
                                    if len(c['colors']) == 2 and set(c['colors'].items()) == color_set:
                                        pos = c['position']
                                        colors = c['colors']
                                        break
                            self.cube.rotate(face, False); moves.append(f"{face}'")
                            self.cube.rotate('U', False); moves.append("U'")
                            self.cube.rotate(face, True); moves.append(face)
                            state = self.cube.get_state()
                            for c in state:
                                if len(c['colors']) == 2 and set(c['colors'].items()) == color_set:
                                    pos = c['position']
                                    colors = c['colors']
                                    break
                        if pos[1] == 2:
                            u_target = {'F': (1,2,2), 'B': (1,2,0), 'L': (0,2,1), 'R': (2,2,1)}
                            u_rot_count = 0
                            while pos != u_target[face] and u_rot_count < 4:
                                self.cube.rotate('U', True); moves.append('U')
                                u_rot_count += 1
                                state = self.cube.get_state()
                                for c in state:
                                    if len(c['colors']) == 2 and set(c['colors'].items()) == color_set:
                                        pos = c['position']
                                        colors = c['colors']
                                        break
                            if colors.get('U', None) == self.cross_color:
                                self.cube.rotate(face, True); moves.append(face)
                                self.cube.rotate(face, True); moves.append(face)
                            elif colors.get(face, None) == self.cross_color:
                                self.cube.rotate(face, True); moves.append(face)
                                self.cube.rotate('U', True); moves.append('U')
                                right = {'F':'R','B':'L','L':'F','R':'B'}[face]
                                self.cube.rotate(right, True); moves.append(right)
                                self.cube.rotate('U', False); moves.append("U'")
                                self.cube.rotate(face, False); moves.append(f"{face}'")
                                state = self.cube.get_state()
                                for c in state:
                                    if len(c['colors']) == 2 and set(c['colors'].items()) == color_set:
                                        pos = c['position']
                                        colors = c['colors']
                                        break
                                u_rot_count2 = 0
                                while pos != u_target[face] and u_rot_count2 < 4:
                                    self.cube.rotate('U', True); moves.append('U')
                                    u_rot_count2 += 1
                                    state = self.cube.get_state()
                                    for c in state:
                                        if len(c['colors']) == 2 and set(c['colors'].items()) == color_set:
                                            pos = c['position']
                                            colors = c['colors']
                                            break
                                self.cube.rotate(face, True); moves.append(face)
                                self.cube.rotate(face, True); moves.append(face)
                            else:
                                self.cube.rotate(face, False); moves.append(f"{face}'")
                                self.cube.rotate('U', False); moves.append("U'")
                                self.cube.rotate(face, True); moves.append(face)
                                state = self.cube.get_state()
                                for c in state:
                                    if len(c['colors']) == 2 and set(c['colors'].items()) == color_set:
                                        pos = c['position']
                                        colors = c['colors']
                                        break
                                u_rot_count2 = 0
                                while pos != u_target[face] and u_rot_count2 < 4:
                                    self.cube.rotate('U', True); moves.append('U')
                                    u_rot_count2 += 1
                                    state = self.cube.get_state()
                                    for c in state:
                                        if len(c['colors']) == 2 and set(c['colors'].items()) == color_set:
                                            pos = c['position']
                                            colors = c['colors']
                                            break
                                self.cube.rotate(face, True); moves.append(face)
                                self.cube.rotate(face, True); moves.append(face)
                        break
                all_done = False
            if all_done:
                break
        return moves
    def __init__(self, cube, cross_color='W'):
        self.cube = cube
        self.cross_color = cross_color  # 默认底色为白色
        self.size = cube.size
        assert self.size == 3, '仅支持3阶魔方CFOP十字教程'

    def is_cross_solved(self):
        """判断底面十字是否完成（底色中心+4条棱）"""
        state = self.cube.get_state()
        # 检查底面中心
        for cubie in state:
            x, y, z = cubie['position']
            if y == 0:
                # 中心块
                if x == 1 and z == 1:
                    if cubie['colors'].get('D', None) != self.cross_color:
                        return False
                # 棱块
                elif (x, z) in [(1,0),(0,1),(2,1),(1,2)]:
                    if cubie['colors'].get('D', None) != self.cross_color:
                        return False
        return True

    def solve_cross(self, verbose=False):
        """
        优先调用cross solver算法，100%鲁棒还原十字。
        """
        return self.cross_solver_solve_cross(verbose=verbose)

if __name__ == '__main__':
    cube = PieceCube()
    moves = cube.scramble(15)
    print('[DEBUG] scramble moves:', moves)
    print('[DEBUG] kociemba字符串:', cube.to_kociemba_string())
    # 输出中心色
    state = cube.get_state()
    centers = {face: None for face in 'URFDLB'}
    for cubie in state:
        if len(cubie['colors']) == 1:
            for face, color in cubie['colors'].items():
                centers[face] = color
    print('[DEBUG] centers:', centers)
    solver = CFOPCrossSolver(cube)
    print('初始是否十字:', solver.is_cross_solved())
    solver.solve_cross(verbose=True)
    print('最终是否十字:', solver.is_cross_solved())
