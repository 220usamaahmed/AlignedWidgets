import importlib.metadata
from .control_widget import ControlWidget
from .video_widget import VideoWidget
from .timeseries_widget import TimeseriesWidget
from .helpers import align, unalign

try:
    __version__ = importlib.metadata.version("aligned_widgets")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"

__all__ = [
    "ControlWidget",
    "VideoWidget",
    "TimeseriesWidget",
    "align",
    "unalign",
]
