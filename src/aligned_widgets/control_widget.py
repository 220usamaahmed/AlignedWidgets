import pathlib

import traitlets

from aligned_widgets.base import AlignedWidget


class ControlWidget(AlignedWidget):
    _esm = AlignedWidget._root / "control_widget.js"
    _css = AlignedWidget._root / "control_widget.css"

    duration = traitlets.Float(0.0).tag(sync=True)
    is_running = traitlets.Bool(False).tag(sync=True)
    sync_time = traitlets.Float(0.0).tag(sync=True)

    icons = traitlets.Dict(
        {
            "play": (AlignedWidget._root / "play.svg").read_text(),
            "pause": (AlignedWidget._root / "pause.svg").read_text(),
        }
    ).tag(sync=True)

    def __init__(self, duration: float, **kwargs):
        super().__init__(**kwargs)

        self.duration = duration
