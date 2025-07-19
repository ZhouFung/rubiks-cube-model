__all__ = ['Cube']
import random
import copy
FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B']
FACE_COLOR = {
    'U': 'W',
    'D': 'Y',
    'F': 'R',
    'B': 'O',
    'L': 'B',
    'R': 'G'
}

class Cube:
    def __init__(self, size=3):
        self.size = size
        self.state = {face: [[FACE_COLOR[face] for _ in range(size)] for _ in range(size)] for face in FACE_ORDER}

    def get_state(self):
        # 返回所有小块的位置和6面颜色（物理朝向下的真实颜色）
        state = []
        for x in range(self.size):
            for y in range(self.size):
                for z in range(self.size):
                    face_color = {}
                    for i, face in enumerate(FACE_ORDER):
                        if face == 'U' and y == self.size-1:
                            face_color['U'] = self.state['U'][x][z]
                        if face == 'D' and y == 0:
                            face_color['D'] = self.state['D'][self.size-1-x][z]
                        if face == 'F' and z == self.size-1:
                            face_color['F'] = self.state['F'][x][self.size-1-y]
                        if face == 'B' and z == 0:
                            face_color['B'] = self.state['B'][self.size-1-x][y]
                        if face == 'L' and x == 0:
                            face_color['L'] = self.state['L'][self.size-1-z][self.size-1-y]
                        if face == 'R' and x == self.size-1:
                            face_color['R'] = self.state['R'][z][self.size-1-y]
                    state.append({'position': (x, y, z), 'colors': face_color})
        return state

    def set_state(self, state):
        self.state = copy.deepcopy(state)

    def rotate(self, face, clockwise=True):
        # 只实现单层基础旋转（如U、D、F、B、L、R）
        n = self.size
        # 1. 旋转该面自身
        def rotate_face(mat):
            return [list(row) for row in zip(*mat[::-1])] if clockwise else [list(row) for row in zip(*mat)][::-1]
        self.state[face] = rotate_face(self.state[face])
        # 2. 旋转侧边
        # 只实现3阶魔方的标准旋转
        if face == 'U':
            rows = [self.state[f][0][:] for f in ['B','R','F','L']]
            if clockwise:
                self.state['B'][0], self.state['R'][0], self.state['F'][0], self.state['L'][0] = rows[-1:] + rows[:-1]
            else:
                self.state['B'][0], self.state['R'][0], self.state['F'][0], self.state['L'][0] = rows[1:] + rows[:1]
        elif face == 'D':
            rows = [self.state[f][-1][:] for f in ['F','R','B','L']]
            if clockwise:
                self.state['F'][-1], self.state['R'][-1], self.state['B'][-1], self.state['L'][-1] = rows[-1:] + rows[:-1]
            else:
                self.state['F'][-1], self.state['R'][-1], self.state['B'][-1], self.state['L'][-1] = rows[1:] + rows[:1]
        elif face == 'F':
            up = [self.state['U'][-1][i] for i in range(n)]
            right = [self.state['R'][i][0] for i in range(n)]
            down = [self.state['D'][0][n-1-i] for i in range(n)]
            left = [self.state['L'][n-1-i][-1] for i in range(n)]
            if clockwise:
                for i in range(n):
                    self.state['U'][-1][i] = left[i]
                    self.state['R'][i][0] = up[i]
                    self.state['D'][0][n-1-i] = right[i]
                    self.state['L'][n-1-i][-1] = down[i]
            else:
                for i in range(n):
                    self.state['U'][-1][i] = right[i]
                    self.state['R'][i][0] = down[i]
                    self.state['D'][0][n-1-i] = left[i]
                    self.state['L'][n-1-i][-1] = up[i]
        elif face == 'B':
            up = [self.state['U'][0][n-1-i] for i in range(n)]
            right = [self.state['R'][i][-1] for i in range(n)]
            down = [self.state['D'][-1][i] for i in range(n)]
            left = [self.state['L'][n-1-i][0] for i in range(n)]
            if clockwise:
                for i in range(n):
                    self.state['U'][0][n-1-i] = left[i]
                    self.state['R'][i][-1] = up[i]
                    self.state['D'][-1][i] = right[i]
                    self.state['L'][n-1-i][0] = down[i]
            else:
                for i in range(n):
                    self.state['U'][0][n-1-i] = right[i]
                    self.state['R'][i][-1] = down[i]
                    self.state['D'][-1][i] = left[i]
                    self.state['L'][n-1-i][0] = up[i]
        elif face == 'L':
            up = [self.state['U'][i][0] for i in range(n)]
            front = [self.state['F'][i][0] for i in range(n)]
            down = [self.state['D'][i][0] for i in range(n)]
            back = [self.state['B'][n-1-i][-1] for i in range(n)]
            if clockwise:
                for i in range(n):
                    self.state['U'][i][0] = back[i]
                    self.state['F'][i][0] = up[i]
                    self.state['D'][i][0] = front[i]
                    self.state['B'][n-1-i][-1] = down[i]
            else:
                for i in range(n):
                    self.state['U'][i][0] = front[i]
                    self.state['F'][i][0] = down[i]
                    self.state['D'][i][0] = back[i]
                    self.state['B'][n-1-i][-1] = up[i]
        elif face == 'R':
            up = [self.state['U'][i][-1] for i in range(n)]
            front = [self.state['F'][i][-1] for i in range(n)]
            down = [self.state['D'][i][-1] for i in range(n)]
            back = [self.state['B'][n-1-i][0] for i in range(n)]
            if clockwise:
                for i in range(n):
                    self.state['U'][i][-1] = front[i]
                    self.state['F'][i][-1] = down[i]
                    self.state['D'][i][-1] = back[i]
                    self.state['B'][n-1-i][0] = up[i]
            else:
                for i in range(n):
                    self.state['U'][i][-1] = back[i]
                    self.state['F'][i][-1] = up[i]
                    self.state['D'][i][-1] = front[i]
                    self.state['B'][n-1-i][0] = down[i]

    def scramble(self, moves_count=20):
        moves = []
        for _ in range(moves_count):
            face = random.choice(FACE_ORDER)
            clockwise = random.choice([True, False])
            self.rotate(face, clockwise)
            moves.append(face + ('' if clockwise else "'"))
        return moves

    def is_solved(self):
        for face in FACE_ORDER:
            color = self.state[face][0][0]
            if any(sticker != color for row in self.state[face] for sticker in row):
                return False
        return True
