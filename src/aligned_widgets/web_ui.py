from flask import Flask, send_from_directory
from pathlib import Path


class WebUI:
    def __init__(self):
        self.app = Flask(__name__, static_folder=None)
        self.base_dir = Path(__file__).resolve().parent
        self.static_dir = self.base_dir / "static"

        print(self.static_dir)

        @self.app.route("/")
        def index():
            return send_from_directory(str(self.static_dir), "web_ui.html")

        @self.app.route("/web_ui.js")
        def web_ui_js():
            return send_from_directory(str(self.static_dir), "web_ui.js")

    def serve(self, blocking=True):
        if blocking:
            self.app.run()
        else:
            import threading

            threading.Thread(target=self.app.run, daemon=True).start()
