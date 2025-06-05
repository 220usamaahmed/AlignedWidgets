from .base import AlignedWidget
import ipywidgets


def align(*widgets: AlignedWidget):
    links = []

    for widget_a, widget_b in zip(widgets, widgets[1:]):
        is_running_link = ipywidgets.link(
            (widget_a, "is_running"), (widget_b, "is_running")
        )
        sync_time_link = ipywidgets.link(
            (widget_a, "sync_time"), (widget_b, "sync_time")
        )

        links.append(is_running_link)
        links.append(sync_time_link)


def unalign(*links: ipywidgets.link):
    for link in reversed(links):
        link.unlink()
