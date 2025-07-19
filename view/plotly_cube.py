import plotly.graph_objects as go
from cube.core import Cube

 # 颜色名和缩写到Plotly十六进制颜色的映射
COLOR_MAP = {
    'W': '#FFFFFF', 'WHITE': '#FFFFFF',
    'Y': '#FFFF00', 'YELLOW': '#FFFF00',
    'R': '#FF0000', 'RED': '#FF0000',
    'O': '#FFA500', 'ORANGE': '#FFA500',
    'B': '#0000FF', 'BLUE': '#0000FF',
    'G': '#008000', 'GREEN': '#008000',
    'BLACK': '#303030',  # 内部面用深灰色
    'NONE': '#B0B0B0',   # 无贴纸（Color.NONE）用浅灰色
}

 # 单个小方块的8个顶点坐标
VERTICES = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],  # Bottom face
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]   # Top face
]

 # 单个小方块的12个三角面，每个三角面用顶点索引表示
FACES = [
    [0, 1, 2], [0, 2, 3],  # Bottom
    [4, 5, 6], [4, 6, 7],  # Top
    [0, 1, 5], [0, 5, 4],  # Back
    [2, 3, 7], [2, 7, 6],  # Front
    [1, 2, 6], [1, 6, 5],  # Right
    [0, 3, 7], [0, 7, 4]   # Left
]

 # 魔方逻辑面名到三角面索引对的映射
FACE_TO_TRIANGLES = {
    'D': [0, 1],
    'U': [2, 3],
    'B': [4, 5],
    'F': [6, 7],
    'R': [8, 9],
    'L': [10, 11]
}

def plot_cube(cube: Cube, title: str = "Rubik's Cube", filename: str = 'cube.html'):
    """生成魔方当前状态的交互式3D可视化。

    参数：
        cube: 要可视化的Cube对象。
        title: 图表标题。
        filename: 保存HTML文件名。
    """
    all_x, all_y, all_z = [], [], []  # 所有顶点坐标
    all_i, all_j, all_k = [], [], []  # 所有三角面索引
    all_face_colors = []              # 所有三角面颜色
    
    cube_state = cube.get_state()     # 获取魔方所有小块状态
    
    offset = 0
    size = cube.size
    for cubelet_data in cube_state:
        pos = cubelet_data['position']
        colors = cubelet_data['colors']

        center_offset = (size - 1) / 2.0  # 居中显示

        for vx, vy, vz in VERTICES:
            all_x.append(vx + (pos[0] - center_offset) - 0.5)
            all_y.append(vy + (pos[2] - center_offset) - 0.5)
            all_z.append(vz + (pos[1] - center_offset) - 0.5)

        # 只渲染魔方外表面
        for face_name, triangle_indices in FACE_TO_TRIANGLES.items():
            # 判断该面是否为外表面
            is_outer = False
            if face_name == 'U' and pos[1] == size - 1:
                is_outer = True
            elif face_name == 'D' and pos[1] == 0:
                is_outer = True
            elif face_name == 'F' and pos[2] == size - 1:
                is_outer = True
            elif face_name == 'B' and pos[2] == 0:
                is_outer = True
            elif face_name == 'R' and pos[0] == size - 1:
                is_outer = True
            elif face_name == 'L' and pos[0] == 0:
                is_outer = True
            if is_outer:
                # 兼容Color枚举、str、无贴纸，优先用单字母大写缩写
                v = colors.get(face_name, 'NONE')
                if hasattr(v, 'name'):
                    color_key = v.name[0].upper()
                elif isinstance(v, str):
                    color_key = v[0].upper() if v else 'NONE'
                else:
                    color_key = str(v)[0].upper() if v else 'NONE'
                color = COLOR_MAP.get(color_key, COLOR_MAP['NONE'])
                for tri_idx in triangle_indices:
                    i, j, k = FACES[tri_idx]
                    all_i.append(i + offset)
                    all_j.append(j + offset)
                    all_k.append(k + offset)
                    all_face_colors.append(color)
        offset += len(VERTICES)

    # 创建Mesh3d三维网格对象
    mesh = go.Mesh3d(
        x=all_x,
        y=all_y,
        z=all_z,
        i=all_i,
        j=all_j,
        k=all_k,
        facecolor=all_face_colors,
        flatshading=True,
        hoverinfo='none'
    )

    # 为每个小块添加边框线条
    edge_traces = []
    for cubelet_data in cube_state:
        pos = cubelet_data['position']
        center_offset = (cube.size - 1) / 2.0
        cx, cy, cz = pos[0] - center_offset, pos[1] - center_offset, pos[2] - center_offset

        # 单个小块的12条边
        edges = [
            ([0,1],[0,0],[0,0]), ([1,1],[0,1],[0,0]), ([1,0],[1,1],[0,0]), ([0,0],[0,1],[0,0]), # 底面
            ([0,1],[0,0],[1,1]), ([1,1],[0,1],[1,1]), ([1,0],[1,1],[1,1]), ([0,0],[0,1],[1,1]), # 顶面
            ([0,0],[0,0],[0,1]), ([1,1],[0,0],[0,1]), ([1,1],[1,1],[0,1]), ([0,0],[1,1],[0,1])  # 垂直边
        ]

        for edge_x, edge_y, edge_z in edges:
            edge_traces.append(go.Scatter3d(
                x=[v + (pos[0] - center_offset) - 0.5 for v in edge_x],
                y=[v + (pos[2] - center_offset) - 0.5 for v in edge_y], # z轴映射到Plotly的y
                z=[v + (pos[1] - center_offset) - 0.5 for v in edge_z], # y轴映射到Plotly的z
                mode='lines',
                line=dict(color='black', width=5),
                hoverinfo='none',
                showlegend=False
            ))

    # 创建布局
    layout = go.Layout(
        title=title,
        scene=dict(
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            zaxis=dict(visible=False),
            aspectmode='data' # 保证魔方为立方体比例
        ),
        margin=dict(l=0, r=0, b=0, t=40)
    )

    # 创建图形并保存为HTML
    fig = go.Figure(data=[mesh] + edge_traces, layout=layout)
    fig.write_html(filename)
    print(f"已保存交互式魔方到 {filename}")

if __name__ == '__main__':
    # 示例用法：
    my_cube = Cube()
    plot_cube(my_cube, title="Solved Cube", filename="cube_solved.html")

    my_cube.scramble(20)
    plot_cube(my_cube, title="Scrambled Cube", filename="cube_scrambled.html")