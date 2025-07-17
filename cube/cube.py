from .cubelet import Cubelet
from .color import Color
from typing import List

class Cube:
    def save_state(self, filepath: str):
        import json
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.get_state(), f, ensure_ascii=False, indent=2)

    def load_state(self, filepath: str):
        import json
        from .cubelet import Cubelet
        with open(filepath, 'r', encoding='utf-8') as f:
            state = json.load(f)
        self.cubelets = []
        for c in state:
            # 颜色字符串转Color枚举
            colors = {k: getattr(Color, v) for k, v in c['colors'].items()}
            self.cubelets.append(Cubelet(c['id'], tuple(c['position']), colors))
    FACES = ['U', 'D', 'L', 'R', 'F', 'B']
    FACE_COLORS = {
        'U': Color.WHITE,
        'D': Color.YELLOW,
        'F': Color.RED,
        'B': Color.ORANGE,
        'L': Color.BLUE,
        'R': Color.GREEN
    }

    def __init__(self, size: int = 3):
        self.size = size
        self.cubelets = self._create_solved_state()

    def _create_solved_state(self) -> List[Cubelet]:
        # 只实现3x3魔方的复原状态
        cubelets = []
        id_counter = 0
        rng = range(self.size)
        for x in rng:
            for y in rng:
                for z in rng:
                    colors = {}
                    if x == 0:
                        colors['L'] = self.FACE_COLORS['L']
                    if x == self.size-1:
                        colors['R'] = self.FACE_COLORS['R']
                    if y == 0:
                        colors['D'] = self.FACE_COLORS['D']
                    if y == self.size-1:
                        colors['U'] = self.FACE_COLORS['U']
                    if z == 0:
                        colors['B'] = self.FACE_COLORS['B']
                    if z == self.size-1:
                        colors['F'] = self.FACE_COLORS['F']
                    cubelets.append(Cubelet(id_counter, (x, y, z), colors))
                    id_counter += 1
        return cubelets

    def scramble(self, moves_count: int = 20):
        import random
        for _ in range(moves_count):
            face = random.choice(self.FACES)
            clockwise = random.choice([True, False])
            self.rotate(face, clockwise)

    def rotate(self, face: str, clockwise: bool = True):
        # 仅实现U面顺时针旋转，便于打乱效果演示
        if face != 'U':
            return
        n = self.size
        # 选出所有y==n-1的cubelet
        layer = [c for c in self.cubelets if c.position[1] == n-1]
        # 记录原始位置
        pos_map = {c.position: c for c in layer}
        # 旋转位置映射
        def rot90(x, z):
            return (z, n-1, n-1-x)
        # 生成新位置
        new_pos = {}
        for c in layer:
            x, y, z = c.position
            nx, ny, nz = rot90(x, z) if clockwise else rot90(z, n-1-x)
            new_pos[(x, y, z)] = (nx, ny, nz)
        # 更新cubelet位置
        for c in layer:
            c.position = new_pos[c.position]
        # 旋转U面相关颜色
        for c in layer:
            # 只旋转U/F/R/B/L面上的颜色
            color_map = c.colors.copy()
            if clockwise:
                # U->U, F->R, R->B, B->L, L->F
                if 'F' in color_map: c.colors['R'] = color_map.pop('F')
                if 'R' in color_map: c.colors['B'] = color_map.pop('R')
                if 'B' in color_map: c.colors['L'] = color_map.pop('B')
                if 'L' in color_map: c.colors['F'] = color_map.pop('L')
            else:
                # U->U, F->L, L->B, B->R, R->F
                if 'F' in color_map: c.colors['L'] = color_map.pop('F')
                if 'L' in color_map: c.colors['B'] = color_map.pop('L')
                if 'B' in color_map: c.colors['R'] = color_map.pop('B')
                if 'R' in color_map: c.colors['F'] = color_map.pop('R')
        # 其余面暂不实现

    def is_solved(self) -> bool:
        # 判断所有cubelet的颜色是否与初始状态一致
        # 这里只是占位实现
        return False

    def get_state(self):
        # 返回所有cubelet的位置和颜色
        return [
            {
                'id': c.id,
                'position': c.position,
                'colors': {k: v.name for k, v in c.colors.items()}
            } for c in self.cubelets
        ]
