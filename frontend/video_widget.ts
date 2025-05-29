import type { AnyModel, RenderProps } from "@anywidget/types";
import "./styles/widget.css";
import "./styles/video_widget.css";
import controlTemplate from "./templates/video_widget.html";

interface VideoWidgetModel {
  is_running: boolean;
  sync_time: number;
  video_url: string;
}

class VideoWidget {
  el: HTMLElement;
  model: AnyModel<VideoWidgetModel>;

  source: HTMLSourceElement;

  constructor({ model, el }: RenderProps<VideoWidgetModel>) {
    this.model = model;
    this.el = el;

    this.el.innerHTML = controlTemplate;
    this.source = el.querySelector("#mp4-source")!;
    this.source.src = this.model.get("video_url");
  }

  syncTimeChanged() {}

  isRunningChanged() {}

  render() {
    this.model.on("change:sync_time", this.syncTimeChanged.bind(this));
    this.model.on("change:is_running", this.isRunningChanged.bind(this));
  }
}

export default {
  render(props: RenderProps<VideoWidgetModel>) {
    const widget = new VideoWidget(props);
    widget.render();
  },
};
