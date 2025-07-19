from cube.core import Cube
from view.plotly_cube import plot_cube

if __name__ == '__main__':
    # 创建一个魔方实例
    my_cube = Cube()

    # 生成一个已复原魔方的HTML文件
    plot_cube(my_cube, title="Solved Cube", filename="cube_solved.html")

    # 打乱魔方并生成HTML文件
    my_cube.scramble(20) # 打乱20步
    plot_cube(my_cube, title="Scrambled Cube", filename="cube_scrambled.html")

    # 对魔方执行CFOP的十字阶段操作
    # 注意：make_cross_cfop 可能会改变魔方状态，所以这里直接在打乱后的魔方上操作
    my_cube.make_cross_cfop()
    plot_cube(my_cube, title="CFOP Cross Stage", filename="cube_cross_cfop.html")