// 文件已删除
import sys
from cube.piece_cube import PieceCube, CORNER_POSITIONS, EDGE_POSITIONS, CENTER_POSITIONS, FACE_COLOR

# kociemba官方参数
KOCIEMBA_CORNER_POSITIONS = [
    ('U','R','F'), ('U','B','R'), ('U','L','B'), ('U','F','L'),
    ('D','F','R'), ('D','R','B'), ('D','B','L'), ('D','L','F')
]
KOCIEMBA_EDGE_POSITIONS = [
    ('U','R'), ('U','F'), ('U','L'), ('U','B'),
    ('F','R'), ('B','R'), ('B','L'), ('F','L'),
    ('D','R'), ('D','F'), ('D','L'), ('D','B')
]
KOCIEMBA_CENTER_POSITIONS = ['U','R','F','D','L','B']
KOCIEMBA_FACE_COLOR = {'U':'W','R':'R','F':'G','D':'Y','L':'O','B':'B'}


def compare_parameters():
    print('==== 角块编号与标准面序 ===')
    for i, (a, b) in enumerate(zip(CORNER_POSITIONS, KOCIEMBA_CORNER_POSITIONS)):
        print(f'角块{i}: PieceCube={a}, kociemba={b}, 一致={a==b}')
    print('\n==== 棱块编号与标准面序 ===')
    for i, (a, b) in enumerate(zip(EDGE_POSITIONS, KOCIEMBA_EDGE_POSITIONS)):
        print(f'棱块{i}: PieceCube={a}, kociemba={b}, 一致={a==b}')
    print('\n==== 中心块顺序 ===')
    print(f'PieceCube={CENTER_POSITIONS}, kociemba={KOCIEMBA_CENTER_POSITIONS}, 一致={CENTER_POSITIONS==KOCIEMBA_CENTER_POSITIONS}')
    print('\n==== 标准色分配 ===')
    for f in KOCIEMBA_CENTER_POSITIONS:
        a = FACE_COLOR[f]
        b = KOCIEMBA_FACE_COLOR[f]
        print(f'{f}: PieceCube={a}, kociemba={b}, 一致={a==b}')

def compare_facelet_string():
    print('\n==== facelet字符串 ===')
    cube = PieceCube()
    s = cube.to_kociemba_string()
    print('PieceCube facelet string:')
    print(s)
    # kociemba官方复原魔方facelet字符串
    kociemba_solved = 'WWWWWWWWW' + 'RRRRRRRRR' + 'GGGGGGGGG' + 'YYYYYYYYY' + 'OOOOOOOOO' + 'BBBBBBBBB'
    print('kociemba solved string:')
    print(kociemba_solved)
    print('完全一致:', s == kociemba_solved)
    # 统计每面颜色数量
    print('\nPieceCube各面贴纸数:')
    for f in 'URFDLB':
        print(f'{f}={s.count(FACE_COLOR[f])}')
    print('\nkociemba各面贴纸数:')
    for f in 'URFDLB':
        print(f'{f}={kociemba_solved.count(FACE_COLOR[f])}')

def compare_get_state():
    print('\n==== get_state详细对比 ===')
    cube = PieceCube()
    state = cube.get_state()
    # 只输出有颜色的块
    for d in state:
        if d['colors']:
            print(f"pos={d['position']}, colors={d['colors']}")

def main():
    compare_parameters()
    compare_facelet_string()
    compare_get_state()

if __name__ == '__main__':
    main()
