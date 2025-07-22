"""
CFOP教程第一阶段：十字（Cross）
本模块实现Cube的白色十字暴力解法与判定。
"""
from cube.kociemba_cube import Cube
from typing import List

# 白色十字棱块编号（DF, DR, DB, DL），Cube.edge_names索引
CROSS_EDGES = [5, 4, 7, 6]  # DF, DR, DB, DL
CROSS_MOVES = ["F", "R", "B", "L", "D", "U"]

def is_cross_solved(cube: Cube) -> bool:
    # 检查DF, DR, DB, DL四棱块是否在D面且朝向正确
    for idx in CROSS_EDGES:
        pos = cube.ep[idx]
        ori = cube.eo[idx]
        if pos not in CROSS_EDGES or ori != 0:
            return False
    return True

def cfop_cross_solver(cube: Cube, max_depth=7) -> List[str]:
    from collections import deque
    MOVE_SET = [m for m in CROSS_MOVES] + [m+"'" for m in CROSS_MOVES] + [m+"2" for m in CROSS_MOVES]
    visited = set()
    queue = deque()
    queue.append((cube, []))
    visited.add((tuple(cube.ep), tuple(cube.eo)))
    while queue:
        cur_cube, moves = queue.popleft()
        if is_cross_solved(cur_cube):
            return moves
        if len(moves) >= max_depth:
            continue
        for mv in MOVE_SET:
            new_cube = Cube()
            new_cube.cp = cur_cube.cp[:]
            new_cube.co = cur_cube.co[:]
            new_cube.ep = cur_cube.ep[:]
            new_cube.eo = cur_cube.eo[:]
            new_cube.move(mv)
            state = (tuple(new_cube.ep), tuple(new_cube.eo))
            if state not in visited:
                visited.add(state)
                queue.append((new_cube, moves + [mv]))
    return []  # 未找到

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
