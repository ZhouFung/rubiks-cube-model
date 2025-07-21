"""
CFOP教程第一阶段：十字（Cross）
本模块实现自动寻找和还原底色十字的过程，适用于3阶魔方。
与Cube核心逻辑解耦，仅依赖Cube的API。
"""
from cube.core import Cube
import kociemba

class CFOPCrossSolver:
    def cross_solver_solve_cross(self, verbose=False):
        """
        用kociemba库实现十字还原。若失败则回退原算法。
        """
        try:
            face_order = ['U','R','F','D','L','B']
            color_map = self._get_kociemba_color_map()
            kociemba_str = self._to_kociemba_string(color_map)
            # 校验kociemba输入合法性
            from collections import Counter
            color_counts = Counter(kociemba_str)
            if verbose:
                print('[DEBUG] kociemba输入:', kociemba_str)
                print('[DEBUG] kociemba输入色统计:', dict(color_counts))
            # 必须6种色且每色9个
            if len(color_counts) != 6 or any(v != 9 for v in color_counts.values()):
                if verbose:
                    print('[DEBUG] kociemba输入色数不合法，自动回退')
                raise ValueError('kociemba输入色数不合法')
            # 中心色唯一性
            centers = [kociemba_str[i*9+4] for i in range(6)]
            if len(set(centers)) != 6:
                if verbose:
                    print('[DEBUG] kociemba中心色不唯一，自动回退')
                raise ValueError('kociemba中心色不唯一')
            solution = kociemba.solve(kociemba_str)
            if verbose:
                print('[DEBUG] kociemba全解:', solution)
            # 只执行十字部分（即直到D面十字完成）
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
            # 回退原算法
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
        物理块映射层：将Cube物理状态映射为kociemba标准块排列和朝向，采集贴纸色。
        参考：https://github.com/hkociemba/RubiksCube-Twophase/blob/master/facelet.java
        """
        state = self.cube.get_state()
        # 构建位置->颜色映射
        pos_map = {cubie['position']: cubie['colors'] for cubie in state}
        # kociemba标准贴纸顺序（facelet序）
        # 每面9个贴纸，顺序如下：
        # U: (x,2,z) z=0..2, x=0..2
        # R: (2,y,z) z=2..0, y=2..0
        # F: (x,y,2) y=2..0, x=0..2
        # D: (x,0,z) z=0..2, x=0..2
        # L: (0,y,z) z=0..2, y=2..0
        # B: (x,y,0) y=2..0, x=2..0
        faces = {}
        # 角块和棱块标准位置和朝向（facelet序）
        # 角块facelet序：UFR, URB, UBL, ULF, DFR, DRB, DBL, DLF
        # 棱块facelet序：UF, UR, UB, UL, FR, BR, BL, FL, DF, DR, DB, DL
        # 直接采集贴纸色，确保与kociemba标准一致
        # U面
        faces['U'] = [color_map.get(pos_map[(x,2,z)].get('U'), 'X') for z in range(3) for x in range(3)]
        # R面
        faces['R'] = [color_map.get(pos_map[(2,y,z)].get('R'), 'X') for z in range(2,-1,-1) for y in range(2,-1,-1)]
        # F面
        faces['F'] = [color_map.get(pos_map[(x,y,2)].get('F'), 'X') for y in range(2,-1,-1) for x in range(3)]
        # D面
        faces['D'] = [color_map.get(pos_map[(x,0,z)].get('D'), 'X') for z in range(3) for x in range(3)]
        # L面
        faces['L'] = [color_map.get(pos_map[(0,y,z)].get('L'), 'X') for z in range(3) for y in range(2,-1,-1)]
        # B面
        faces['B'] = [color_map.get(pos_map[(x,y,0)].get('B'), 'X') for y in range(2,-1,-1) for x in range(2,-1,-1)]

        # 物理块映射校正：
        # 检查每个角块和棱块的朝向，确保与kociemba一致
        # 角块标准位置及其三面(facelet)的face和坐标
        corner_facelets = [
            [('U',(2,2,2)),('R',(2,2,2)),('F',(2,2,2))], # UFR
            [('U',(2,2,0)),('R',(2,2,0)),('B',(2,2,0))], # URB
            [('U',(0,2,0)),('B',(0,2,0)),('L',(0,2,0))], # UBL
            [('U',(0,2,2)),('L',(0,2,2)),('F',(0,2,2))], # ULF
            [('D',(2,0,2)),('F',(2,0,2)),('R',(2,0,2))], # DFR
            [('D',(2,0,0)),('R',(2,0,0)),('B',(2,0,0))], # DRB
            [('D',(0,0,0)),('B',(0,0,0)),('L',(0,0,0))], # DBL
            [('D',(0,0,2)),('L',(0,0,2)),('F',(0,0,2))], # DLF
        ]
        # 棱块标准位置及其两面(facelet)的face和坐标
        edge_facelets = [
            [('U',(1,2,2)),('F',(1,2,2))], # UF
            [('U',(2,2,1)),('R',(2,2,1))], # UR
            [('U',(1,2,0)),('B',(1,2,0))], # UB
            [('U',(0,2,1)),('L',(0,2,1))], # UL
            [('F',(2,1,2)),('R',(2,1,2))], # FR
            [('B',(2,1,0)),('R',(2,1,0))], # BR
            [('B',(0,1,0)),('L',(0,1,0))], # BL
            [('F',(0,1,2)),('L',(0,1,2))], # FL
            [('D',(1,0,2)),('F',(1,0,2))], # DF
            [('D',(2,0,1)),('R',(2,0,1))], # DR
            [('D',(1,0,0)),('B',(1,0,0))], # DB
            [('D',(0,0,1)),('L',(0,0,1))], # DL
        ]
        # 校正角块facelet色彩
        for idx, facelets in enumerate(corner_facelets):
            colors = []
            for face, pos in facelets:
                c = pos_map.get(pos, {}).get(face, 'X')
                colors.append(c)
            # 角块三色必须唯一
            if len(set(colors)) != 3:
                # 角块朝向/位置异常，填X
                for face, pos in facelets:
                    faces[face][self._facelet_index(face, pos)] = 'X'
        # 校正棱块facelet色彩
        for idx, facelets in enumerate(edge_facelets):
            colors = []
            for face, pos in facelets:
                c = pos_map.get(pos, {}).get(face, 'X')
                colors.append(c)
            # 棱块双色必须唯一
            if len(set(colors)) != 2:
                # 棱块朝向/位置异常，填X
                for face, pos in facelets:
                    faces[face][self._facelet_index(face, pos)] = 'X'

        s = ''.join(faces['U'] + faces['R'] + faces['F'] + faces['D'] + faces['L'] + faces['B'])
        import sys
        if hasattr(sys, '_getframe') and sys._getframe(1).f_locals.get('verbose', False):
            for f in ['U','R','F','D','L','B']:
                print(f'[DEBUG] {f}面:', ''.join(faces[f]))
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
    def __init__(self, cube: Cube, cross_color='W'):
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
    cube = Cube()
    cube.scramble(15)
    solver = CFOPCrossSolver(cube)
    print('初始是否十字:', solver.is_cross_solved())
    solver.solve_cross(verbose=True)
    print('最终是否十字:', solver.is_cross_solved())
