import pathlib

import anywidget
import traitlets


class ControlWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "control_widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "control_widget.css"

    duration = traitlets.Float(0.0).tag(sync=False)
    is_running = traitlets.Bool(False).tag(sync=True)
    sync_time = traitlets.Float(0.0).tag(sync=True)

    def __init__(self, duration: float, **kwargs):
        super().__init__(**kwargs)

        self.duration = duration
