import typing as _t

import pathlib
import socket
import logging
from werkzeug.serving import make_server
from threading import Thread
import atexit

from flask import Flask, send_from_directory, jsonify


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

            # Set up logging
            self.logger = logging.getLogger("FileServer")
            self.logger.setLevel(logging.INFO)
            file_handler = logging.FileHandler("file_server.log")
            formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
            self.logger.info("Initializing FileServer.")

            self.flask_app = Flask(__name__)
            self.port = None
            self.server = None
            self.server_thread = None

            self.files: _t.List[pathlib.Path] = []

            self._setup_routes()
            self._start_server()
            atexit.register(self._cleanup)

    def _setup_routes(self):
        @self.flask_app.route("/")
        def index():
            self.logger.info("Index route accessed.")
            return "File server for Aligned Wigets"

        @self.flask_app.route("/debug")
        def debug():
            self.logger.info("Debug route accessed.")
            return jsonify({"current_files": [str(file) for file in self.files]})

        @self.flask_app.route("/<int:file_index>")
        def serve_video(file_index: int):
            try:
                path = self.files[file_index]
                directory = path.parent
                filename = path.name
                self.logger.info(f"Serving file: {path}")
                return send_from_directory(directory, filename)
            except IndexError:
                self.logger.error(f"File index {file_index} out of range.")
                return "File not found", 404
            except Exception as e:
                self.logger.error(f"Error serving file at index {file_index}: {e}")
                return "Internal server error", 500

    def _start_server(self):
        # Find available port
        sock = socket.socket()
        sock.bind(("", 0))
        self.port = sock.getsockname()[1]
        sock.close()

        self.server = make_server("127.0.0.1", self.port, self.flask_app)

        def run_server():
            self.logger.info(f"Starting server on port {self.port}")
            self.server.serve_forever()

        self.server_thread = Thread(target=run_server, daemon=True)
        self.server_thread.start()
        self.logger.info("Server thread started.")

    def _cleanup(self):
        if self.server:
            self.logger.info("Shutting down server.")
            self.server.shutdown()
            if self.server_thread:
                self.server_thread.join(timeout=2)
                self.logger.info("Server thread joined.")

    def get_file_url(self, filepath: pathlib.Path):
        assert self._initialized

        self.files.append(filepath)
        self.logger.info(f"Registered file: {filepath}")

        return f"http://localhost:{self.port}/{len(self.files) - 1}"
