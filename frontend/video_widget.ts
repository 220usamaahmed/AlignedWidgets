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

  video: HTMLVideoElement;
  source: HTMLSourceElement;

  constructor({ model, el }: RenderProps<VideoWidgetModel>) {
    this.model = model;
    this.el = el;

    this.el.innerHTML = controlTemplate;
    this.video = el.querySelector("#video")!;
    this.source = el.querySelector("#mp4-source")!;
    this.source.src = this.model.get("video_url");

    this.video.addEventListener("seeked", this.seeked.bind(this));
    this.video.addEventListener("play", this.played.bind(this));
    this.video.addEventListener("pause", this.paused.bind(this));
  }

  played() {
    this.model.set("is_running", true);
    this.model.set("sync_time", this.video.currentTime);
    this.model.save_changes();
  }

  paused() {
    this.model.set("is_running", false);
    this.model.set("sync_time", this.video.currentTime);
    this.model.save_changes();
  }

  seeked() {
    this.model.set("sync_time", this.video.currentTime);
    this.model.save_changes();
  }

  syncTimeChanged() {
    console.log("syncTimeChanged", this.model.get("sync_time"));
    this.video.currentTime = this.model.get("sync_time");
  }

  isRunningChanged() {
    if (this.model.get("is_running")) this.video.play();
    else this.video.pause();
  }

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
