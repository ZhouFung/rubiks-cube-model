class TutorialStep:
    def __init__(self, description: str, cube_state):
        self.description = description
        self.cube_state = cube_state

class Tutorial:
    def __init__(self):
        self.steps = []

    def add_step(self, step: TutorialStep):
        self.steps.append(step)

    def get_steps(self):
        return self.steps
