import pathlib

import anywidget
import traitlets
import numpy as np


class TimeseriesWidget(anywidget.AnyWidget):
    _root = pathlib.Path(__file__).parent / "static"

    _esm = _root / "timeseries_widget.js"
    _css = _root / "timeseries_widget.css"

    values = traitlets.Bytes(b"").tag(sync=True)
    times = traitlets.Bytes(b"").tag(sync=True)

    is_running = traitlets.Bool(False).tag(sync=True)
    sync_time = traitlets.Float(0.0).tag(sync=True)

    def __init__(self, times: np.ndarray, values: np.ndarray, **kwargs):
        super().__init__(**kwargs)

        # TODO: Handle these validations in a better way, make less restrictive
        assert len(times.shape) == 1, "times should be a 1 dimensional numpy array"
        assert len(values.shape) == 2, "values should be a 2 dimensional numpy array"
        assert (
            times.shape[0] == values.shape[1]
        ), "times and values shapes not compatiable"
        assert times.dtype == "float64"
        assert values.dtype == "float64"

        self.times = times.tobytes()
        self.values = values.tobytes()
