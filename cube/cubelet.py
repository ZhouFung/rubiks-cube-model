from .color import Color
from typing import Dict

class Cubelet:
    def __init__(self, position: tuple, colors: Dict[str, Color]):
        self.position = position  # (x, y, z)
        self.colors = colors      # {'U': Color.WHITE, ...}
