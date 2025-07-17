from .color import Color
from typing import List

class Face:
    def __init__(self, color: Color, positions: List[tuple]):
        self.color = color
        self.positions = positions
