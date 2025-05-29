import pathlib

import anywidget
import traitlets


class ControlWidget(anywidget.AnyWidget):
    _root = pathlib.Path(__file__).parent / "static"

    _esm = _root / "control_widget.js"
    _css = _root / "control_widget.css"

    duration = traitlets.Float(0.0).tag(sync=True)
    is_running = traitlets.Bool(False).tag(sync=True)
    sync_time = traitlets.Float(0.0).tag(sync=True)

    icons = traitlets.Dict(
        {
            "play": (_root / "play.svg").read_text(),
            "pause": (_root / "pause.svg").read_text(),
        }
    ).tag(sync=True)

    def __init__(self, duration: float, **kwargs):
        super().__init__(**kwargs)

        self.duration = duration
