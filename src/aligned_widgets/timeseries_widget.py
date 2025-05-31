import typing as _t

import pathlib

import anywidget
import traitlets
import numpy as np


class Annotation(_t.TypedDict):
    start: str
    end: str
    tag: str


class TimeseriesWidget(anywidget.AnyWidget):
    _root = pathlib.Path(__file__).parent / "static"

    _esm = _root / "timeseries_widget.js"
    _css = _root / "timeseries_widget.css"

    title = traitlets.Unicode().tag(sync=True)
    times = traitlets.Bytes(b"").tag(sync=True)
    values = traitlets.Bytes(b"").tag(sync=True)
    channel_names = traitlets.List([]).tag(sync=True)
    annotations = traitlets.List([]).tag(sync=True)

    is_running = traitlets.Bool(False).tag(sync=True)
    sync_time = traitlets.Float(0.0).tag(sync=True)

    icons = traitlets.Dict(
        {
            "add": (_root / "add.svg").read_text(),
            "delete": (_root / "delete.svg").read_text(),
            "zoom_in": (_root / "zoom_in.svg").read_text(),
            "zoom_out": (_root / "zoom_out.svg").read_text(),
        }
    ).tag(sync=True)

    def __init__(
        self,
        times: np.ndarray,
        values: np.ndarray,
        annotations: _t.List[Annotation] = [],
        *,
        channel_names: _t.List[str] = [],
        title: str = "",
        **kwargs
    ):
        super().__init__(**kwargs)

        # TODO: Handle these validations in a better way, make less restrictive
        assert len(times.shape) == 1, "times should be a 1 dimensional numpy array"
        assert len(values.shape) == 2, "values should be a 2 dimensional numpy array"
        assert len(channel_names) == 0 or len(channel_names) == values.shape[0]
        assert (
            times.shape[0] == values.shape[1]
        ), "times and values shapes not compatiable"
        assert times.dtype == "float64"
        assert values.dtype == "float64"

        self.times = times.tobytes()
        self.values = values.tobytes()
        self.annotations = annotations
        self.channel_names = channel_names
        self.title = title
