import typing as _t

import pathlib
from threading import Thread

from flask import Flask, send_from_directory


class FileServer:

    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._initialized = True
            self.app = Flask(__name__)
            self.files: _t.List[pathlib.Path] = []
            self._start_server()

    def _start_server(self):
        @self.app.route("/<int:file_index>")
        def serve_video(file_index: int):
            path = self.files[file_index]
            directory = path.parent
            filename = path.name
            return send_from_directory(directory, filename)

        def run():
            self.app.run(port=8123, threaded=True)

        thread = Thread(target=run, daemon=True)
        thread.start()

    def get_file_url(self, filepath: pathlib.Path):
        assert self._initialized

        self.files.append(filepath)

        return f"http://localhost:8123/{len(self.files) - 1}"
