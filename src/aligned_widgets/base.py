import pathlib

from anywidget import AnyWidget


class AlignedWidget(AnyWidget):
    _root = pathlib.Path(__file__).parent / "static"
