import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from cube.cube import Cube
from cube.color import Color

COLOR_MAP = {
    'WHITE': '#FFFFFF',
    'YELLOW': '#FFFF00',
    'RED': '#FF0000',
    'ORANGE': '#FF8000',
    'BLUE': '#0000FF',
    'GREEN': '#00FF00',
}

FACE_DIRS = {
    'U': (0, 1, 0),
    'D': (0, -1, 0),
    'F': (0, 0, 1),
    'B': (0, 0, -1),
    'L': (-1, 0, 0),
    'R': (1, 0, 0),
}

def plot_cube(cube: Cube):
    import matplotlib
    try:
        matplotlib.use('Agg')  # 无界面环境下自动切换后端
    except Exception:
        pass
    fig = plt.figure(figsize=(6, 6))
    ax = fig.add_subplot(111, projection='3d')
    # 兼容不同matplotlib版本
    # set_box_aspect 仅在较新matplotlib可用，老版本跳过
    # set_box_aspect 仅在matplotlib>=3.4可用，参数应为(x, y, z)元组
    if hasattr(ax, 'set_box_aspect'):
        try:
            ax.set_box_aspect((1, 1, 1))
        except Exception:
            pass
    size = cube.size
    for c in cube.cubelets:
        x, y, z = c.position
        for face, color in c.colors.items():
            verts = get_face_vertices(x, y, z, face, size)
            poly = Poly3DCollection([verts], facecolors=COLOR_MAP[color.name], edgecolor='k')
            # add_collection3d 仅3D坐标轴可用
            if hasattr(ax, 'add_collection3d'):
                ax.add_collection3d(poly)
            else:
                ax.add_collection(poly)
    ax.set_xlim(0, size)
    ax.set_ylim(0, size)
    if hasattr(ax, 'set_zlim'):
        ax.set_zlim(0, size)
    ax.set_axis_off()
    plt.tight_layout()
    # 测试环境下保存图片，避免弹窗
    plt.savefig('cube_plot.png')
    # plt.show()  # 如需本地交互可解注释

def get_face_vertices(x, y, z, face, size):
    # 返回指定方块某一面的四个顶点坐标
    d = 0.98  # 方块间留缝
    if face == 'U':
        return [(x, y+1, z), (x+1, y+1, z), (x+1, y+1, z+1), (x, y+1, z+1)]
    if face == 'D':
        return [(x, y, z), (x+1, y, z), (x+1, y, z+1), (x, y, z+1)]
    if face == 'F':
        return [(x, y, z+1), (x+1, y, z+1), (x+1, y+1, z+1), (x, y+1, z+1)]
    if face == 'B':
        return [(x, y, z), (x+1, y, z), (x+1, y+1, z), (x, y+1, z)]
    if face == 'L':
        return [(x, y, z), (x, y+1, z), (x, y+1, z+1), (x, y, z+1)]
    if face == 'R':
        return [(x+1, y, z), (x+1, y+1, z), (x+1, y+1, z+1), (x+1, y, z+1)]
    return []
