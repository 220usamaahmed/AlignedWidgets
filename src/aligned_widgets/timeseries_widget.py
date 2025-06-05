import typing as _t

import pathlib

import traitlets
import numpy as np

from aligned_widgets.base import AlignedWidget


class Annotation(_t.TypedDict):
    start: str
    end: str
    tags: _t.List[str]


class TimeseriesWidget(AlignedWidget):
    _esm = AlignedWidget._root / "timeseries_widget.js"
    _css = AlignedWidget._root / "timeseries_widget.css"

    title = traitlets.Unicode().tag(sync=True)
    times = traitlets.Bytes().tag(sync=True)
    values = traitlets.Bytes().tag(sync=True)
    channel_names = traitlets.List().tag(sync=True)
    annotations = traitlets.List().tag(sync=True)
    tags = traitlets.List().tag(sync=True)
    y_range = traitlets.Dict().tag(sync=True)

    is_running = traitlets.Bool(False).tag(sync=True)
    sync_time = traitlets.Float(0.0).tag(sync=True)

    icons = traitlets.Dict(
        {
            "add": (AlignedWidget._root / "add.svg").read_text(),
            "delete": (AlignedWidget._root / "delete.svg").read_text(),
            "zoom_in": (AlignedWidget._root / "zoom_in.svg").read_text(),
            "zoom_out": (AlignedWidget._root / "zoom_out.svg").read_text(),
        }
    ).tag(sync=True)

    def __init__(
        self,
        times: np.ndarray,
        values: np.ndarray,
        *,
        tags: _t.List[str] = [],
        annotations: _t.List[Annotation] = [],
        channel_names: _t.List[str] = [],
        title: str = "",
        y_range: _t.Tuple = (None, None),
        **kwargs,
    ):
        super().__init__(**kwargs)

        # TODO: Handle these validations in a better way, make less restrictive
        assert len(times.shape) == 1, "times should be a 1 dimensional numpy array"
        assert len(values.shape) == 2, "values should be a 2 dimensional numpy array"
        assert len(channel_names) == 0 or len(channel_names) == values.shape[0]
        assert times.shape[0] == values.shape[1], (
            "times and values shapes not compatiable"
        )
        assert times.dtype == "float64"
        assert values.dtype == "float64"
        for ann in annotations:
            for tag in ann["tags"]:
                assert tag in tags, "All annotation tags must also be in tags list"

        self.times = times.tobytes()
        self.values = values.tobytes()
        self.tags = list(set(tags))
        self.annotations = annotations
        self.channel_names = channel_names
        self.title = title
        self.y_range = {"min": y_range[0], "max": y_range[1]}
