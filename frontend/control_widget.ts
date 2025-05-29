import type { AnyModel, RenderProps } from "@anywidget/types";
import "./styles/widget.css";
import "./styles/control_widget.css";
import controlTemplate from "./templates/control_widget.html";

interface ControlWidgetModel {
  is_running: boolean;
  duration: number;
  sync_time: number;
}

class ControlWidget {
  el: HTMLElement;
  model: AnyModel<ControlWidgetModel>;
  currentTime: number;
  lastAnimationFrameTimestamp: DOMHighResTimeStamp | null = null;
  animationFrameRequestId: number | null = null;
  btnTogglePlay: HTMLButtonElement;
  btnRewind: HTMLButtonElement;
  btnForward: HTMLButtonElement;
  inputRangeProgress: HTMLInputElement;
  spanCurrentTime: HTMLSpanElement;
  spanTotalTime: HTMLSpanElement;

  constructor({ model, el }: RenderProps<ControlWidgetModel>) {
    this.model = model;
    this.el = el;

    this.currentTime = this.model.get("sync_time");

    this.step = this.step.bind(this);
    this.btnTogglePlayClicked = this.btnTogglePlayClicked.bind(this);
    this.inputRangeProgressChanged = this.inputRangeProgressChanged.bind(this);
    this.syncTime = this.syncTime.bind(this);

    this.el.innerHTML = controlTemplate;
    this.btnTogglePlay = el.querySelector("#btn-toggle-play")!;
    this.btnRewind = el.querySelector("#btn-rewind")!;
    this.btnForward = el.querySelector("#btn-forward")!;
    this.inputRangeProgress = el.querySelector("#input-range-progress")!;
    this.spanCurrentTime = el.querySelector("#span-current-time")!;
    this.spanTotalTime = el.querySelector("#span-total-time")!;

    this.btnTogglePlay.addEventListener("click", this.btnTogglePlayClicked);
    this.btnRewind.addEventListener("click", this.btnRewindClicked);
    this.btnForward.addEventListener("click", this.btnForwardClicked);
    this.inputRangeProgress.addEventListener(
      "change",
      this.inputRangeProgressChanged
    );
  }

  inputRangeProgressChanged(event: Event) {
    const value = +(event.target as HTMLInputElement).value;
    this.currentTime = value * this.model.get("duration");
    this.model.set("sync_time", this.currentTime);
    this.model.save_changes();
  }

  btnTogglePlayClicked() {
    console.log(
      "btn clicked",
      this.currentTime,
      this.model.get("sync_time"),
      this
    );

    const currentTime = this.currentTime;
    const is_running = this.model.get("is_running");

    this.model.set("sync_time", currentTime);
    this.model.set("is_running", !is_running);
    this.model.save_changes();

    this.btnTogglePlay.innerHTML = !is_running ? "Pause" : "Play";
  }

  btnRewindClicked() {}

  btnForwardClicked() {}

  formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const paddedMins = String(mins).padStart(2, "0");
    const paddedSecs = String(secs).padStart(2, "0");

    return hrs > 0
      ? `${String(hrs).padStart(2, "0")}:${paddedMins}:${paddedSecs}`
      : `${paddedMins}:${paddedSecs}`;
  }

  step(timestamp: DOMHighResTimeStamp) {
    if (!this.lastAnimationFrameTimestamp)
      this.lastAnimationFrameTimestamp = timestamp;
    const delta = timestamp - this.lastAnimationFrameTimestamp;
    this.lastAnimationFrameTimestamp = timestamp;

    if (this.model.get("is_running")) {
      const duration = this.model.get("duration");
      this.currentTime = Math.min(this.currentTime + delta / 1000, duration);
      this.inputRangeProgress.value = (this.currentTime / duration).toFixed(2);
    }

    this.animationFrameRequestId = requestAnimationFrame(this.step);
  }

  syncTime() {
    this.currentTime = this.model.get("sync_time");
    console.log("here syncing time", this.currentTime);

    this.inputRangeProgress.value = (
      this.currentTime / this.model.get("duration")
    ).toFixed(2);

    this.spanCurrentTime.innerHTML = this.formatTime(this.currentTime);
    this.spanTotalTime.innerHTML = this.formatTime(this.model.get("duration"));
  }

  render() {
    // this.model.on("change:sync_time", this.syncTime);
    this.model.on("change:is_running", this.syncTime);

    this.animationFrameRequestId = requestAnimationFrame(this.step);
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameRequestId!);
  }
}

export default {
  render(props: RenderProps<ControlWidgetModel>) {
    const widget = new ControlWidget(props);
    widget.render();
    return () => widget.destroy();
  },
};
