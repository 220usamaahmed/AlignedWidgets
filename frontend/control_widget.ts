import type { AnyModel, RenderProps } from "@anywidget/types";
import "./styles/widget.css";
import "./styles/control_widget.css";
import controlTemplate from "./templates/control_widget.html";

interface ControlWidgetModel {
  is_running: boolean;
  duration: number;
  current_time: number;
}

class ControlWidget {
  el: HTMLElement;
  model: AnyModel<ControlWidgetModel>;
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

    this.step = this.step.bind(this);
    this.btnTogglePlayClicked = this.btnTogglePlayClicked.bind(this);
    this.inputRangeProgressChanged = this.inputRangeProgressChanged.bind(this);
    this.durationUpdated = this.durationUpdated.bind(this);

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
    const time = value * this.model.get("duration");
    this.model.set("current_time", time);
    this.model.save_changes();
  }

  btnTogglePlayClicked() {
    const is_running = this.model.get("is_running");
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
      const currentTime = this.model.get("current_time");
      const duration = this.model.get("duration");
      const updatedTime = Math.min(currentTime + delta / 1000, duration);
      this.model.set("current_time", updatedTime);
      this.inputRangeProgress.value = (updatedTime / duration).toFixed(2);

      this.model.save_changes();
    }

    this.animationFrameRequestId = requestAnimationFrame(this.step);
  }

  durationUpdated() {
    this.spanCurrentTime.innerHTML = this.formatTime(
      this.model.get("current_time")
    );
    this.spanTotalTime.innerHTML = this.formatTime(this.model.get("duration"));
  }

  render() {
    this.model.on("change:current_time", this.durationUpdated);

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
