from .cubelet import Cubelet
from .color import Color
from typing import List

class Cube:
    def make_cross_cfop(self, face: str = 'U'):
        """
        完整CFOP白色十字还原（仅U面白色，3x3魔方）。
        """
        print("Starting CFOP Cross Stage...")
        cross_color = self.FACE_COLORS[face] # 通常是白色 (U面颜色)

        # 定义十字棱块的目标位置和颜色
        # (x, y, z) 是逻辑坐标 (0-2)
        # 侧面颜色是与中心块对齐的颜色
        # 目标位置的y坐标是0 (D层)
        target_edges_info = {
            'F': {'pos': (1, 0, 2), 'side_face': 'F', 'other_color': self.FACE_COLORS['F']}, # Front-Down edge
            'B': {'pos': (1, 0, 0), 'side_face': 'B', 'other_color': self.FACE_COLORS['B']}, # Back-Down edge
            'L': {'pos': (0, 0, 1), 'side_face': 'L', 'other_color': self.FACE_COLORS['L']}, # Left-Down edge
            'R': {'pos': (2, 0, 1), 'side_face': 'R', 'other_color': self.FACE_COLORS['R']}, # Right-Down edge
        }

        for target_face_name, info in target_edges_info.items():
            target_pos = info['pos']
            target_side_face = info['side_face']
            target_other_color = info['other_color']
            
            print(f"\n--- Solving edge for {target_face_name} face (color: {target_other_color.name}) ---")

            # 循环直到当前棱块到达目标位置和方向
            while True:
                edge_cubelet = None
                # 找到目标棱块 (白色 + 目标侧面颜色)
            edge_cubelet = None
            for c in self.cubelets:
                # Debugging prints
                # print(f"  Checking cubelet {c.id}: Pos={c.position}, Colors={c.colors}")
                # print(f"    Cross Color: {cross_color.name}, Target Other Color: {target_other_color.name}")
                # print(f"    c.colors.values(): {[col.name for col in c.colors.values()]}")

                if len(c.colors) == 2 and cross_color in c.colors.values() and target_other_color in c.colors.values():
                    edge_cubelet = c
                    break
                
                if not edge_cubelet:
                    print(f"Error: Could not find edge for {target_face_name} face. This should not happen in a valid cube state.")
                    break # Should not happen

                current_pos = edge_cubelet.position
                current_colors = edge_cubelet.colors

                # 检查是否已完成
                if current_pos == target_pos and current_colors.get('D') == cross_color and current_colors.get(target_side_face) == target_other_color:
                    print(f"Edge {edge_cubelet.id} ({target_face_name}) is correctly placed and oriented.")
                    break # This edge is solved, move to the next one

                print(f"Current state of edge {edge_cubelet.id} ({target_face_name}): Pos={current_pos}, Colors={current_colors}")

                # Case 1: Edge is in the D layer but misoriented or in the wrong slot
                if current_pos[1] == 0: # In D layer
                    print(f"Edge {edge_cubelet.id} is in D layer, but not solved. Bringing to U layer.")
                    # Bring it to U layer using a simple F/B/L/R move
                    if current_pos[2] == 2: self.rotate('F') # F face
                    elif current_pos[2] == 0: self.rotate('B') # B face
                    elif current_pos[0] == 0: self.rotate('L') # L face
                    elif current_pos[0] == 2: self.rotate('R') # R face
                    self.rotate('U') # Rotate U to get it out of the way
                    self.rotate(target_side_face, False) # Reverse the face move to restore the cross if it was already there
                    continue # Re-evaluate position after moves

                # Case 2: Edge is in the M layer (y=1)
                elif current_pos[1] == 1:
                    print(f"Edge {edge_cubelet.id} in M layer. Bringing to U layer.")
                    # Bring it to U layer
                    if current_pos[2] == 2: self.rotate('F') # F face
                    elif current_pos[2] == 0: self.rotate('B') # B face
                    elif current_pos[0] == 0: self.rotate('L') # L face
                    elif current_pos[0] == 2: self.rotate('R') # R face
                    self.rotate('U') # Rotate U to get it out of the way
                    continue # Re-evaluate position after moves

                # Case 3: Edge is in the U layer (y=2)
                elif current_pos[1] == 2:
                    print(f"Edge {edge_cubelet.id} in U layer. Aligning and inserting.")
                    # Rotate U layer until the edge is above its target D-layer slot
                    # and its side color matches the center
                    
                    # Find the current side face of the edge in the U layer
                    current_u_side_face = None
                    if current_pos == (1, 2, 2): current_u_side_face = 'F'
                    elif current_pos == (1, 2, 0): current_u_side_face = 'B'
                    elif current_pos == (0, 2, 1): current_u_side_face = 'L'
                    elif current_pos == (2, 2, 1): current_u_side_face = 'R'
                    
                    if not current_u_side_face:
                        print(f"Error: Edge {edge_cubelet.id} in U layer but not in a valid edge position.")
                        self.rotate('U') # Try rotating U to get it into a valid position
                        continue

                    # Rotate U until current_u_side_face matches target_side_face
                    u_rotations = 0
                    while current_u_side_face != target_side_face:
                        self.rotate('U')
                        u_rotations += 1
                        if u_rotations > 4: # Should not happen
                            print("Error: U-layer rotation loop exceeded 4 rotations.")
                            break
                        # Re-evaluate current_u_side_face after U rotation
                        current_pos = edge_cubelet.position # Position might change after U rotation
                        if current_pos == (1, 2, 2): current_u_side_face = 'F'
                        elif current_pos == (1, 2, 0): current_u_side_face = 'B'
                        elif current_pos == (0, 2, 1): current_u_side_face = 'L'
                        elif current_pos == (2, 2, 1): current_u_side_face = 'R'
                    
                    print(f"Edge {edge_cubelet.id} aligned above target slot. Now inserting.")

                    # Insert the edge
                    if edge_cubelet.colors.get('U') == cross_color: # White face is on U (top)
                        print(f"White face up. Inserting with {target_side_face}2.")
                        self.rotate(target_side_face)
                        self.rotate(target_side_face)
                    else: # White face sideways
                        print(f"White face sideways. Inserting with R U R' or similar.")
                        # This is a common case: white face is on the side, other color matches center
                        # Perform R U R' (or equivalent for other faces)
                        if target_side_face == 'F':
                            self.rotate('F', False) # F'
                            self.rotate('U', False) # U'
                            self.rotate('F') # F
                        elif target_side_face == 'B':
                            self.rotate('B', False) # B'
                            self.rotate('U', False) # U'
                            self.rotate('B') # B
                        elif target_side_face == 'L':
                            self.rotate('L', False) # L'
                            self.rotate('U', False) # U'
                            self.rotate('L') # L
                        elif target_side_face == 'R':
                            self.rotate('R', False) # R'
                            self.rotate('U', False) # U'
                            self.rotate('R') # R
                    continue # Re-evaluate position after moves

        print("\nCFOP Cross Stage Finished.")
        print(f"Is cross solved? {self.is_cross(face)}")
    def is_cross(self, face: str = 'U') -> bool:
        """
        检查指定面是否已成十字。默认U面（白色）。
        十字定义：中心块和四条棱块该面颜色一致，且棱块侧面颜色与相应面中心一致。
        """
        center_color = self.FACE_COLORS[face]
        n = self.size
        # 找到中心块位置
        if face == 'U':
            center_pos = (1, n-1, 1)
            cross_edges = [
                (1, n-1, 0, 'B', 'U'),
                (1, n-1, 2, 'F', 'U'),
                (0, n-1, 1, 'L', 'U'),
                (2, n-1, 1, 'R', 'U'),
            ]
        else:
            # 只实现U面
            return False
        # 检查中心块颜色
        center = next((c for c in self.cubelets if c.position == center_pos), None)
        if not center or center.colors.get(face) != center_color:
            return False
        # 检查四条棱块
        for x, y, z, side, up in cross_edges:
            cubelet = next((c for c in self.cubelets if c.position == (x, y, z)), None)
            if not cubelet or cubelet.colors.get(up) != center_color:
                return False
            # 检查侧面颜色与中心一致
            side_center_pos = {
                'F': (1, 1, 2),
                'B': (1, 1, 0),
                'L': (0, 1, 1),
                'R': (2, 1, 1)
            }[side]
            side_center = next((c for c in self.cubelets if c.position == side_center_pos), None)
            if not side_center or cubelet.colors.get(side) != side_center.colors.get(side):
                return False
        return True


    def _is_edge_on_face(self, cubelet, face, other_face):
        # 判断棱块是否在指定面和另一面交界
        pos = cubelet.position
        if face == 'F' and pos[2] == 2 and pos[1] == 0:
            return True
        if face == 'B' and pos[2] == 0 and pos[1] == 0:
            return True
        if face == 'L' and pos[0] == 0 and pos[1] == 0:
            return True
        if face == 'R' and pos[0] == 2 and pos[1] == 0:
            return True
        return False
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
        """
        旋转指定面。face: 'U','D','L','R','F','B'。clockwise: True顺时针，False逆时针。
        """
        if face == 'U':
            self._rotate_U(clockwise)
        elif face == 'D':
            self._rotate_D(clockwise)
        elif face == 'L':
            self._rotate_L(clockwise)
        elif face == 'R':
            self._rotate_R(clockwise)
        elif face == 'F':
            self._rotate_F(clockwise)
        elif face == 'B':
            self._rotate_B(clockwise)

    def _rotate_U(self, clockwise: bool):
        n = self.size
        layer = [c for c in self.cubelets if c.position[1] == n-1]
        def rot90(x, z):
            return (z, n-1, n-1-x)
        self._rotate_layer(layer, rot90, clockwise, ['U', 'F', 'R', 'B', 'L'])

    def _rotate_D(self, clockwise: bool):
        n = self.size
        layer = [c for c in self.cubelets if c.position[1] == 0]
        def rot90(x, z):
            return (n-1-z, 0, x)
        # D面顺时针等价于底面顺时针
        self._rotate_layer(layer, rot90, clockwise, ['D', 'F', 'L', 'B', 'R'])

    def _rotate_L(self, clockwise: bool):
        n = self.size
        layer = [c for c in self.cubelets if c.position[0] == 0]
        def rot90(y, z):
            return (0, z, n-1-y)
        self._rotate_layer(layer, rot90, clockwise, ['L', 'U', 'F', 'D', 'B'])

    def _rotate_R(self, clockwise: bool):
        n = self.size
        layer = [c for c in self.cubelets if c.position[0] == n-1]
        def rot90(y, z):
            return (n-1, z, y)
        self._rotate_layer(layer, rot90, clockwise, ['R', 'U', 'B', 'D', 'F'])

    def _rotate_F(self, clockwise: bool):
        n = self.size
        layer = [c for c in self.cubelets if c.position[2] == n-1]
        def rot90(x, y):
            return (y, n-1-x, n-1)
        self._rotate_layer(layer, rot90, clockwise, ['F', 'U', 'R', 'D', 'L'])

    def _rotate_B(self, clockwise: bool):
        n = self.size
        layer = [c for c in self.cubelets if c.position[2] == 0]
        def rot90(x, y):
            return (n-1-y, x, 0)
        self._rotate_layer(layer, rot90, clockwise, ['B', 'U', 'L', 'D', 'R'])

    def _rotate_layer(self, layer, rot90, clockwise, faces):
        # 旋转位置
        pos_map = {c.position: c for c in layer}
        new_pos = {}
        for c in layer:
            x, y, z = c.position
            if len(faces) == 5:
                # 取出旋转轴外的两个坐标
                coords = [v for i, v in enumerate((x, y, z)) if (faces[0] in ['U','D'] and i!=1) or (faces[0] in ['L','R'] and i!=0) or (faces[0] in ['F','B'] and i!=2)]
                nx, ny, nz = rot90(*coords)
                # 补回旋转轴坐标
                if faces[0] in ['U','D']:
                    ny = y
                elif faces[0] in ['L','R']:
                    nx = x
                elif faces[0] in ['F','B']:
                    nz = z
            else:
                nx, ny, nz = rot90(x, y, z)
            new_pos[(x, y, z)] = (nx, ny, nz)
        for c in layer:
            c.position = new_pos[c.position]
        # 旋转颜色
        rotating_face = faces[0]
        adjacent_faces = faces[1:] # These are the faces whose colors will rotate

        for c in layer:
            original_colors = c.colors.copy()
            new_colors = {}
            
            # The color on the rotating_face itself does not change its face assignment
            if rotating_face in original_colors:
                new_colors[rotating_face] = original_colors[rotating_face]
            
            # Rotate colors for adjacent faces
            for i, current_face in enumerate(adjacent_faces):
                if current_face in original_colors:
                    if clockwise:
                        next_face_index = (i + 1) % len(adjacent_faces)
                        new_colors[adjacent_faces[next_face_index]] = original_colors[current_face]
                    else: # Counter-clockwise
                        prev_face_index = (i - 1 + len(adjacent_faces)) % len(adjacent_faces)
                        new_colors[adjacent_faces[prev_face_index]] = original_colors[current_face]
            
            # Copy any colors that are not part of the rotating layer's outer faces
            for face, color in original_colors.items():
                if face not in faces: # Only copy if the face is not one of the faces involved in the rotation
                    new_colors[face] = color

            c.colors = new_colors

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
