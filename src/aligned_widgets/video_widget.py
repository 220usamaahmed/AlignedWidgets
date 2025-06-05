import pathlib

import traitlets

from aligned_widgets.base import AlignedWidget
from aligned_widgets.file_server import FileServer


class VideoWidget(AlignedWidget):
    _esm = AlignedWidget._root / "video_widget.js"
    _css = AlignedWidget._root / "video_widget.css"

    video_url = traitlets.Unicode().tag(sync=True)
    is_running = traitlets.Bool(False).tag(sync=True)
    sync_time = traitlets.Float(0.0).tag(sync=True)

    def __init__(self, video_path: str, **kwargs):
        super().__init__(**kwargs)

        path = pathlib.Path(video_path)
        if not path.is_file():
            raise FileNotFoundError(f"Video file '{video_path}' does not exist.")
        if path.suffix.lower() != ".mp4":
            raise ValueError(f"Video file '{video_path}' is not an mp4 file.")

        self.video_url = FileServer().get_file_url(path)
