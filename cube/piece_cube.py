# 国际标准块模型的3阶魔方实现，兼容kociemba
# 仅支持3阶

from copy import deepcopy
import random

# 角块编号及其标准面序（UFR, URB, UBL, ULF, DFR, DRB, DBL, DLF）
CORNER_POSITIONS = [
    ('U','F','R'), ('U','R','B'), ('U','B','L'), ('U','L','F'),
    ('D','F','R'), ('D','R','B'), ('D','B','L'), ('D','L','F')
]
# 棱块编号及其标准面序（UF, UR, UB, UL, FR, BR, BL, FL, DF, DR, DB, DL）
EDGE_POSITIONS = [
    ('U','F'), ('U','R'), ('U','B'), ('U','L'),
    ('F','R'), ('B','R'), ('B','L'), ('F','L'),
    ('D','F'), ('D','R'), ('D','B'), ('D','L')
]
# 中心块，严格URFDLB顺序，确保facelet字符串中心色顺序与kociemba官方一致
CENTER_POSITIONS = ['U','R','F','D','L','B']  # 保持不变，facelet_indices需严格URFDLB顺序
# 标准色序，严格URFDLB顺序，kociemba默认：U=W, R=R, F=G, D=Y, L=O, B=B
FACE_COLOR = {'U':'W','R':'R','F':'G','D':'Y','L':'O','B':'B'}

class PieceCube:
    def get_state(self):
        """
        返回所有27个小块的位置和6面颜色（物理朝向下的真实颜色），兼容Cube.get_state格式。
        只支持3阶，中心/棱/角块自动映射。
        """
        state = []
        # 1. 中心块
        center_pos_map = {
            'U': (1,2,1), 'D': (1,0,1), 'F': (1,1,2), 'B': (1,1,0), 'L': (0,1,1), 'R': (2,1,1)
        }
        for i, f in enumerate(CENTER_POSITIONS):
            pos = center_pos_map[f]
            state.append({'position': pos, 'colors': {f: FACE_COLOR[f]}})
        # 2. 角块（face分配与Cube完全一致，且输出标准色）
        corner_pos_map = [
            (2,2,2), (2,2,0), (0,2,0), (0,2,2),
            (2,0,2), (2,0,0), (0,0,0), (0,0,2)
        ]
        corner_face_map = [
            ('U','R','F'), ('U','B','R'), ('U','L','B'), ('U','F','L'),
            ('D','F','R'), ('D','R','B'), ('D','B','L'), ('D','L','F')
        ]
        for idx, (pos, ori) in enumerate(self.corners):
            faces = list(CORNER_POSITIONS[pos])
            for _ in range(ori):
                faces = [faces[2], faces[0], faces[1]]
            std_faces = list(corner_face_map[idx])
            colors = {std_faces[i]: FACE_COLOR[faces[i]] for i in range(3)}
            state.append({'position': corner_pos_map[idx], 'colors': colors})
        # 3. 棱块（face分配与Cube完全一致，且输出标准色）
        edge_pos_map = [
            (1,2,2), (2,2,1), (1,2,0), (0,2,1),
            (2,1,2), (2,1,0), (0,1,0), (0,1,2),
            (1,0,2), (2,0,1), (1,0,0), (0,0,1)
        ]
        edge_face_map = [
            ('U','F'), ('U','R'), ('U','B'), ('U','L'),
            ('F','R'), ('B','R'), ('B','L'), ('F','L'),
            ('D','F'), ('D','R'), ('D','B'), ('D','L')
        ]
        for idx, (pos, ori) in enumerate(self.edges):
            faces = list(EDGE_POSITIONS[pos])
            if ori == 1:
                faces = faces[::-1]
            std_faces = list(edge_face_map[idx])
            colors = {std_faces[i]: FACE_COLOR[faces[i]] for i in range(2)}
            state.append({'position': edge_pos_map[idx], 'colors': colors})
        # 4. 填充其余小块（中心块、棱块、角块已覆盖，剩余为无色块）
        filled = set(tuple(d['position']) for d in state)
        for x in range(3):
            for y in range(3):
                for z in range(3):
                    if (x,y,z) not in filled:
                        state.append({'position': (x,y,z), 'colors': {}})
        return state
    def __init__(self):
        self.size = 3  # 兼容CFOPCrossSolver等需要size属性的用法
        # 角块: 8个, 每个(位置, 朝向), 位置0-7, 朝向0-2
        self.corners = [(i,0) for i in range(8)]
        # 棱块: 12个, 每个(位置, 朝向), 位置0-11, 朝向0-1
        self.edges = [(i,0) for i in range(12)]
        # 中心块: 固定
        self.centers = list(CENTER_POSITIONS)
    def copy(self):
        c = PieceCube()
        c.corners = deepcopy(self.corners)
        c.edges = deepcopy(self.edges)
        c.centers = list(self.centers)
        return c
    def rotate(self, face, clockwise=True):
        # 只实现3阶标准旋转，face in 'URFDLB'
        # 角块旋转表: 每个面影响的角块索引及其朝向变化
        # kociemba标准旋转表
        # kociemba标准旋转表，朝向变化严格对齐官方
        corner_cycles = {
            'U': [(0,1,2,3), (0,0,0,0)],
            'D': [(4,5,6,7), (0,0,0,0)],
            'F': [(0,3,7,4), (1,2,1,2)],  # 顺时针+1，逆时针-1
            'B': [(1,2,6,5), (2,1,2,1)],  # 顺时针-1，逆时针+1
            'L': [(2,3,7,6), (1,2,1,2)],  # 顺时针+1，逆时针-1
            'R': [(0,1,5,4), (2,1,2,1)]   # 顺时针+1，逆时针-1
        }
        edge_cycles = {
            'U': [(0,1,2,3), (0,0,0,0)],
            'D': [(8,9,10,11), (0,0,0,0)],
            'F': [(0,7,8,4), (1,1,1,1)],   # 顺时针+1，逆时针-1
            'B': [(2,5,10,6), (1,1,1,1)],  # 顺时针+1，逆时针-1
            'L': [(3,6,11,7), (1,1,1,1)],  # 顺时针+1，逆时针-1
            'R': [(1,4,9,5), (1,1,1,1)]    # 顺时针+1，逆时针-1
        }
        idxs, ori_shifts = corner_cycles[face]
        # 角块朝向变化规则与Cube完全一致
        if face in 'FBRL':
            # F/L顺时针+1，逆时针-1；B/R顺时针-1，逆时针+1
            shift = 1 if (face in 'FL' and clockwise) or (face in 'BR' and not clockwise) else -1
        else:
            shift = 0
        if not clockwise:
            idxs = idxs[::-1]
        tmp = [self.corners[i] for i in idxs]
        for i in range(4):
            pos, ori = tmp[(i-1)%4]
            new_ori = ori
            if shift != 0:
                new_ori = (ori + shift * ori_shifts[i]) % 3
            self.corners[idxs[i]] = (pos, new_ori)
        idxs, ori_shifts = edge_cycles[face]
        # 棱块朝向变化规则与Cube完全一致
        if face in 'FBRL':
            shift = 1 if clockwise else -1
        else:
            shift = 0
        if not clockwise:
            idxs = idxs[::-1]
        tmp = [self.edges[i] for i in idxs]
        for i in range(4):
            pos, ori = tmp[(i-1)%4]
            new_ori = ori
            if shift != 0:
                new_ori = (ori + shift) % 2
            self.edges[idxs[i]] = (pos, new_ori)
    def scramble(self, moves_count=20):
        moves = []
        for _ in range(moves_count):
            face = random.choice('URFDLB')
            clockwise = random.choice([True, False])
            self.rotate(face, clockwise)
            moves.append(face + ('' if clockwise else "'"))
        return moves
    def is_solved(self):
        return all(pos==i and ori==0 for i,(pos,ori) in enumerate(self.corners)) and \
               all(pos==i and ori==0 for i,(pos,ori) in enumerate(self.edges))
    def to_kociemba_string(self):
        """
        输出kociemba标准facelet顺序贴纸色彩字符串（URFDLB顺序，行优先，标准色），与Cube完全一致。
        """
        # 采集Cube.get_state的facelet顺序和物理坐标
        # U: y==2, x=0..2, z=0..2
        # R: x==2, z=0..2, y=2..0
        # F: z==2, x=0..2, y=2..0
        # D: y==0, x=2..0, z=0..2
        # L: x==0, z=2..0, y=2..0
        # B: z==0, x=2..0, y=2..0
        state = self.get_state()
        pos_map = {}
        for cubie in state:
            pos_map[tuple(cubie['position'])] = cubie['colors']
        s = ''
        # U面
        for z in range(3):
            for x in range(3):
                s += pos_map[(x,2,z)].get('U','X')
        # R面
        for z in range(3):
            for y in range(2,-1,-1):
                s += pos_map[(2,y,z)].get('R','X')
        # F面
        for y in range(2,-1,-1):
            for x in range(3):
                s += pos_map[(x,y,2)].get('F','X')
        # D面
        for z in range(3):
            for x in range(2,-1,-1):
                s += pos_map[(x,0,z)].get('D','X')
        # L面
        for z in range(2,-1,-1):
            for y in range(2,-1,-1):
                s += pos_map[(0,y,z)].get('L','X')
        # B面
        for y in range(2,-1,-1):
            for x in range(2,-1,-1):
                s += pos_map[(x,y,0)].get('B','X')
        return s
# kociemba官方facelet编号映射表
# 角块在各面上的坐标（UFR, URB, UBL, ULF, DFR, DRB, DBL, DLF）
corner_u_coords = [(0,2),(0,0),(2,0),(2,2),None,None,None,None]
corner_d_coords = [None,None,None,None,(2,0),(0,0),(0,2),(2,2)]
corner_f_coords = [(0,2),None,None,(2,2),(2,0),None,None,(0,0)]
corner_b_coords = [None,(0,0),(2,0),None,None,(0,2),(2,2),None]
corner_l_coords = [None,None,(0,0),(0,2),None,None,(2,2),(2,0)]
corner_r_coords = [(2,2),(2,0),None,None,(0,2),(0,0),None,None]
# 棱块在各面上的坐标（UF, UR, UB, UL, FR, BR, BL, FL, DF, DR, DB, DL）
edge_u_coords = [(1,2),(0,1),(1,0),(2,1),None,None,None,None,None,None,None,None]
edge_d_coords = [None,None,None,None,None,None,None,None,(1,0),(0,1),(1,2),(2,1)]
edge_f_coords = [(0,1),None,None,(2,1),(2,1),None,None,(0,1),(1,2),None,None,(1,0)]
edge_b_coords = [None,(0,1),(2,1),None,None,(2,1),(0,1),None,None,(1,0),(1,2),None]
edge_l_coords = [None,None,(1,0),(0,1),None,None,(1,2),(2,1),None,None,(1,2),(2,1)]
edge_r_coords = [(2,1),(1,0),None,None,(1,0),(0,1),None,None,(2,1),(1,2),None,None]
