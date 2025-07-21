# 输出PieceCube初始状态的kociemba字符串并与官方标准facelet字符串比对
from cube.piece_cube import PieceCube

def main():
    cube = PieceCube()
    s = cube.to_kociemba_string()
    print("PieceCube初始状态kociemba字符串:")
    print(s)
    print("长度:", len(s))
    print("官方标准:")
    std = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
    print(std)
    print("长度:", len(std))
    print("逐位对比(不同处显示^):")
    diff = ['^' if a != b else ' ' for a, b in zip(s, std)]
    print(''.join(diff))
    for i in range(0, 54, 9):
        print(f"{i:2d}-{i+8:2d}: {s[i:i+9]}  |  {std[i:i+9]}  |  {''.join(diff[i:i+9])}")

if __name__ == "__main__":
    main()
