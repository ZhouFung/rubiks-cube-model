from cube.piece_cube import PieceCube

def print_bottom_edges_state():
    cube = PieceCube()
    cube.scramble(15)
    from tutorial.cfop_cross import CFOPCrossSolver
    solver = CFOPCrossSolver(cube)
    solver.solve_cross(verbose=True)
    state = cube.get_state()
    print("--- D面棱块状态 ---")
    # D面4条棱块标准物理坐标
    d_edges = [(1,0,2), (2,0,1), (1,0,0), (0,0,1)]
    for pos in d_edges:
        for cubie in state:
            if cubie['position'] == pos:
                print(f"位置: {pos}, 颜色: {cubie['colors']}")
                break

if __name__ == "__main__":
    print_bottom_edges_state()
