// 文件已删除

from cube.piece_cube import PieceCube


def dump_piececube_facelets():
    pc = PieceCube()
    state = pc.get_state()
    print("--- PieceCube所有块face分配与标准色 ---")
    for cubie in state:
        pos = tuple(cubie['position'])
        for face, color in cubie['colors'].items():
            print(f"位置: {pos}, face: {face}, color: {color}")



if __name__ == '__main__':
    dump_piececube_facelets()
