from .color import Color
from typing import Dict

class Cubelet:
    def __init__(self, id: int, position: tuple, colors: Dict[str, Color]):
        self.id = id  # 唯一标识
        self.position = position  # (x, y, z)
        self.colors = colors      # {'U': Color.WHITE, ...}

    def copy(self):
        return Cubelet(self.id, self.position, self.colors.copy())
