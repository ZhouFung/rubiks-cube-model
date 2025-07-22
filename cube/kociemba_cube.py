# kociemba官方Cube类（简化版，仅用于块编号/朝向对比）
# 来源：https://github.com/hkociemba/Cube-Corner-Edge-Model/blob/master/cube.py
# 仅保留cp, co, ep, eo, move方法

class Cube:
    # 角块编号顺序: URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB
    corner_names = ['URF','UFL','ULB','UBR','DFR','DLF','DBL','DRB']
    # 棱块编号顺序: UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR
    edge_names = ['UR','UF','UL','UB','DR','DF','DL','DB','FR','FL','BL','BR']
    # 角块旋转表
    corner_cycles = {
        'U': [0,1,2,3], 'D': [4,5,6,7],
        'F': [0,3,7,4], 'B': [1,2,6,5],
        'L': [2,3,7,6], 'R': [0,1,5,4]
    }
    corner_orient_delta = {
        'U': [0,0,0,0], 'D': [0,0,0,0],
        'F': [1,2,1,2], 'B': [2,1,2,1],
        'L': [1,2,1,2], 'R': [2,1,2,1]
    }
    edge_cycles = {
        'U': [0,1,2,3], 'D': [4,5,6,7],
        'F': [1,9,5,8], 'B': [3,11,7,10],
        'L': [2,10,6,9], 'R': [0,8,4,11]
    }
    edge_orient_delta = {
        'U': [0,0,0,0], 'D': [0,0,0,0],
        'F': [1,1,1,1], 'B': [1,1,1,1],
        'L': [1,1,1,1], 'R': [1,1,1,1]
    }
    def __init__(self):
        self.cp = list(range(8))
        self.co = [0]*8
        self.ep = list(range(12))
        self.eo = [0]*12
        self.size = 3  # 兼容plotly_cube

    def to_kociemba_string(self):
        color_map = {'U':'Y','R':'R','F':'G','D':'W','L':'O','B':'B'}
        faces = {f: [['X']*3 for _ in range(3)] for f in 'URFDLB'}
        faces['U'][1][1] = 'W'
        faces['R'][1][1] = 'R'
        faces['F'][1][1] = 'G'
        faces['D'][1][1] = 'Y'
        faces['L'][1][1] = 'O'
        faces['B'][1][1] = 'B'
        corner_adj = [
            [('U',0,2),('R',0,0),('F',0,2)],
            [('U',0,0),('F',0,0),('L',0,2)],
            [('U',2,0),('L',0,0),('B',0,2)],
            [('U',2,2),('B',0,0),('R',0,2)],
            [('D',2,2),('F',2,2),('R',2,0)],
            [('D',2,0),('L',2,2),('F',2,0)],
            [('D',0,0),('B',2,2),('L',2,0)],
            [('D',0,2),('R',2,2),('B',2,0)]
        ]
        corner_color = [
            ('U','R','F'),('U','F','L'),('U','L','B'),('U','B','R'),
            ('D','F','R'),('D','L','F'),('D','B','L'),('D','R','B')
        ]
        for i in range(8):
            c = self.cp[i]
            ori = self.co[i]
            cols = list(corner_color[c])
            for _ in range(ori):
                cols = [cols[1], cols[2], cols[0]]
            for (face, x, y), col in zip(corner_adj[i], cols):
                faces[face][x][y] = color_map[col]
        edge_adj = [
            ('U',1,2),('U',0,1),('U',1,0),('U',2,1),
            ('D',1,2),('D',0,1),('D',1,0),('D',2,1),
            ('F',0,1),('F',2,1),('B',0,1),('B',2,1)
        ]
        edge_color = [
            ('U','R'),('U','F'),('U','L'),('U','B'),
            ('D','R'),('D','F'),('D','L'),('D','B'),
            ('F','R'),('F','L'),('B','L'),('B','R')
        ]
        for i in range(12):
            e = self.ep[i]
            ori = self.eo[i]
            cols = list(edge_color[e])
            if ori:
                cols = cols[::-1]
            (f1,x1,y1) = edge_adj[i]
            (f2,x2,y2) = edge_adj[(i+4)%12]
            faces[f1][x1][y1] = color_map[cols[0]]
            faces[f2][x2][y2] = color_map[cols[1]]
        s = ''
        for f in 'URFDLB':
            for x in range(3):
                for y in range(3):
                    s += faces[f][x][y]
        return s

    def move(self, move):
        face = move[0]
        clockwise = not (len(move)>1 and move[1] == "'")
        idxs = self.corner_cycles[face]
        oris = self.corner_orient_delta[face]
        if not clockwise:
            idxs = idxs[::-1]
            oris = oris[::-1]
        tmp_cp = [self.cp[i] for i in idxs]
        tmp_co = [self.co[i] for i in idxs]
        for i in range(4):
            self.cp[idxs[i]] = tmp_cp[(i-1)%4]
            self.co[idxs[i]] = (tmp_co[(i-1)%4] + oris[i]) % 3
        idxs = self.edge_cycles[face]
        oris = self.edge_orient_delta[face]
        if not clockwise:
            idxs = idxs[::-1]
            oris = oris[::-1]
        tmp_ep = [self.ep[i] for i in idxs]
        tmp_eo = [self.eo[i] for i in idxs]
        for i in range(4):
            self.ep[idxs[i]] = tmp_ep[(i-1)%4]
            self.eo[idxs[i]] = (tmp_eo[(i-1)%4] + oris[i]) % 2

    def get_state(self):
        # 兼容plotly_cube的可视化接口，输出与PieceCube一致的结构
        FACE_COLOR = {'U':'W','R':'R','F':'G','D':'Y','L':'O','B':'B'}
        CENTER_POSITIONS = ['U','R','F','D','L','B']
        state = []
        center_pos_map = {
            'U': (1,2,1), 'D': (1,0,1), 'F': (1,1,2), 'B': (1,1,0), 'L': (0,1,1), 'R': (2,1,1)
        }
        for i, f in enumerate(CENTER_POSITIONS):
            pos = center_pos_map[f]
            state.append({'position': pos, 'colors': {f: FACE_COLOR[f]}})
        corner_pos_map = [
            (2,2,2), (2,2,0), (0,2,0), (0,2,2),
            (2,0,2), (2,0,0), (0,0,0), (0,0,2)
        ]
        corner_face_map = [
            ('U','R','F'), ('U','B','R'), ('U','L','B'), ('U','F','L'),
            ('D','F','R'), ('D','R','B'), ('D','B','L'), ('D','L','F')
        ]
        for idx in range(8):
            c = self.cp[idx]
            ori = self.co[idx]
            faces = list(corner_face_map[c])
            for _ in range(ori):
                faces = [faces[1], faces[2], faces[0]]
            std_faces = list(corner_face_map[idx])
            colors = {std_faces[i]: FACE_COLOR[faces[i]] for i in range(3)}
            state.append({'position': corner_pos_map[idx], 'colors': colors})
        edge_pos_map = [
            (2,2,1), (1,2,2), (0,2,1), (1,2,0),
            (2,1,2), (2,1,0), (0,1,0), (0,1,2),
            (2,0,1), (1,0,2), (0,0,1), (1,0,0)
        ]
        edge_face_map = [
            ('U','R'), ('U','F'), ('U','L'), ('U','B'),
            ('F','R'), ('B','R'), ('B','L'), ('F','L'),
            ('D','R'), ('D','F'), ('D','L'), ('D','B')
        ]
        for idx in range(12):
            e = self.ep[idx]
            ori = self.eo[idx]
            faces = list(edge_face_map[e])
            if ori == 1:
                faces = faces[::-1]
            std_faces = list(edge_face_map[idx])
            colors = {std_faces[i]: FACE_COLOR[faces[i]] for i in range(2)}
            state.append({'position': edge_pos_map[idx], 'colors': colors})
        filled = set(tuple(d['position']) for d in state)
        for x in range(3):
            for y in range(3):
                for z in range(3):
                    if (x,y,z) not in filled:
                        state.append({'position': (x,y,z), 'colors': {}})
        return state
