import pathlib
from threading import Thread

import anywidget
import traitlets
from flask import Flask, send_from_directory


app = Flask(__name__)
server_running = False


class VideoWidget(anywidget.AnyWidget):
    _root = pathlib.Path(__file__).parent / "static"

    _esm = _root / "video_widget.js"
    _css = _root / "video_widget.css"

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

        self._start_server(path)

    def _start_server(self, video_path: pathlib.Path):
        global server_running

        if server_running:
            return
        server_running = True

        video_dir = video_path.parent
        video_filename = video_path.name

        @app.route("/video")
        def serve_video():
            return send_from_directory(video_dir, video_filename)

        def run():
            app.run(port=8123, threaded=True)

        thread = Thread(target=run, daemon=True)
        thread.start()

        self.video_url = "http://localhost:8123/video"
