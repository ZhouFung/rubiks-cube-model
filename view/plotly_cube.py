import plotly.graph_objects as go
from cube.cube import Cube

# Map color names to hex codes for Plotly
COLOR_MAP = {
    'WHITE': '#FFFFFF',
    'YELLOW': '#FFFF00',
    'RED': '#FF0000',
    'ORANGE': '#FFA500',
    'BLUE': '#0000FF',
    'GREEN': '#008000',
    'BLACK': '#303030'  # A dark grey for internal faces
}

# Define the 8 vertices of a unit cube
VERTICES = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],  # Bottom face
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]   # Top face
]

# Define the 12 triangular faces of a unit cube using vertex indices
FACES = [
    [0, 1, 2], [0, 2, 3],  # Bottom
    [4, 5, 6], [4, 6, 7],  # Top
    [0, 1, 5], [0, 5, 4],  # Back
    [2, 3, 7], [2, 7, 6],  # Front
    [1, 2, 6], [1, 6, 5],  # Right
    [0, 3, 7], [0, 7, 4]   # Left
]

# Map logical face names to the corresponding pairs of triangle indices
FACE_TO_TRIANGLES = {
    'D': [0, 1],
    'U': [2, 3],
    'B': [4, 5],
    'F': [6, 7],
    'R': [8, 9],
    'L': [10, 11]
}

def plot_cube(cube: Cube, title: str = "Rubik's Cube", filename: str = 'cube.html'):
    """Generates an interactive 3D plot of the Rubik's Cube state.

    Args:
        cube: The Cube object to visualize.
        title: The title of the plot.
        filename: The name of the HTML file to save the plot to.
    """
    all_x, all_y, all_z = [], [], []
    all_i, all_j, all_k = [], [], []
    all_face_colors = []
    
    cube_state = cube.get_state()
    
    offset = 0
    for cubelet_data in cube_state:
        pos = cubelet_data['position']
        colors = cubelet_data['colors']
        
        # Center the cube for better visualization
        center_offset = (cube.size - 1) / 2.0
        cx, cy, cz = pos[0] - center_offset, pos[1] - center_offset, pos[2] - center_offset

        # Add vertices for the current cubelet, translated to its position
        for vx, vy, vz in VERTICES:
            all_x.append(vx + (pos[0] - center_offset) - 0.5)
            all_y.append(vy + (pos[2] - center_offset) - 0.5) # cube.py's z (front/back) becomes Plotly's y
            all_z.append(vz + (pos[1] - center_offset) - 0.5) # cube.py's y (up/down) becomes Plotly's z

        # Add faces for the current cubelet
        for i, j, k in FACES:
            all_i.append(i + offset)
            all_j.append(j + offset)
            all_k.append(k + offset)
        
        offset += len(VERTICES)

        # Assign colors to the faces of the cubelet
        face_colors = [COLOR_MAP['BLACK']] * 12 # Default to black
        for face_name, triangle_indices in FACE_TO_TRIANGLES.items():
            if face_name in colors:
                color = COLOR_MAP[colors[face_name]]
                for index in triangle_indices:
                    face_colors[index] = color
        all_face_colors.extend(face_colors)

    # Create the Mesh3d trace
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

    # Add edges for each cubelet
    edge_traces = []
    for cubelet_data in cube_state:
        pos = cubelet_data['position']
        center_offset = (cube.size - 1) / 2.0
        cx, cy, cz = pos[0] - center_offset, pos[1] - center_offset, pos[2] - center_offset

        # Define the 12 edges of a unit cube
        edges = [
            ([0,1],[0,0],[0,0]), ([1,1],[0,1],[0,0]), ([1,0],[1,1],[0,0]), ([0,0],[0,1],[0,0]), # Bottom
            ([0,1],[0,0],[1,1]), ([1,1],[0,1],[1,1]), ([1,0],[1,1],[1,1]), ([0,0],[0,1],[1,1]), # Top
            ([0,0],[0,0],[0,1]), ([1,1],[0,0],[0,1]), ([1,1],[1,1],[0,1]), ([0,0],[1,1],[0,1])  # Vertical
        ]

        for edge_x, edge_y, edge_z in edges:
            edge_traces.append(go.Scatter3d(
                x=[v + (pos[0] - center_offset) - 0.5 for v in edge_x],
                y=[v + (pos[2] - center_offset) - 0.5 for v in edge_y], # cube.py's z (front/back) becomes Plotly's y
                z=[v + (pos[1] - center_offset) - 0.5 for v in edge_z], # cube.py's y (up/down) becomes Plotly's z
                mode='lines',
                line=dict(color='black', width=5),
                hoverinfo='none',
                showlegend=False
            ))

    # Create the layout
    layout = go.Layout(
        title=title,
        scene=dict(
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            zaxis=dict(visible=False),
            aspectmode='data' # Ensures the cube looks like a cube
        ),
        margin=dict(l=0, r=0, b=0, t=40)
    )

    # Create the figure and save it
    fig = go.Figure(data=[mesh] + edge_traces, layout=layout)
    fig.write_html(filename)
    print(f"Saved interactive cube to {filename}")

if __name__ == '__main__':
    # Example usage:
    my_cube = Cube()
    plot_cube(my_cube, title="Solved Cube", filename="cube_solved.html")

    my_cube.scramble(20)
    plot_cube(my_cube, title="Scrambled Cube", filename="cube_scrambled.html")