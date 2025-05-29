import type { AnyModel, RenderProps } from "@anywidget/types";
import "./styles/widget.css";
import "./styles/control_widget.css";
import controlTemplate from "./templates/control_widget.html";

interface ControlWidgetModel {
  is_running: boolean;
  duration: number;
  sync_time: number;
  icons: {
    play: string;
    pause: string;
  };
}

class ControlWidget {
  el: HTMLElement;
  model: AnyModel<ControlWidgetModel>;

  currentTime: number;
  lastAnimationFrameTimestamp: DOMHighResTimeStamp | null = null;
  animationFrameRequestId: number | null = null;

  btnTogglePlay: HTMLButtonElement;
  inputRangeProgress: HTMLInputElement;
  spanCurrentTime: HTMLSpanElement;
  spanTotalTime: HTMLSpanElement;

  constructor({ model, el }: RenderProps<ControlWidgetModel>) {
    this.model = model;
    this.el = el;

    this.currentTime = this.model.get("sync_time");

    // Initialize DOM elements
    this.el.innerHTML = controlTemplate;
    this.btnTogglePlay = el.querySelector("#btn-toggle-play")!;
    this.inputRangeProgress = el.querySelector("#input-range-progress")!;
    this.spanCurrentTime = el.querySelector("#span-current-time")!;
    this.spanTotalTime = el.querySelector("#span-total-time")!;

    // Set initial state UI
    this.btnTogglePlay.innerHTML = this.model.get("icons").play;
    this.spanTotalTime.innerHTML = this.formatTime(this.model.get("duration"));

    // Event listeneres
    this.btnTogglePlay.addEventListener(
      "click",
      this.btnTogglePlayClicked.bind(this)
    );
    this.inputRangeProgress.addEventListener(
      "change",
      this.inputRangeProgressChanged.bind(this)
    );
  }

  inputRangeProgressChanged(event: Event) {
    const value = +(event.target as HTMLInputElement).value;
    this.currentTime = value * this.model.get("duration");
    this.model.set("sync_time", this.currentTime);
    this.model.save_changes();
  }

  btnTogglePlayClicked() {
    this.model.set("sync_time", this.currentTime);
    this.model.set("is_running", !this.model.get("is_running"));
    this.model.save_changes();
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
      this.spanCurrentTime.innerHTML = this.formatTime(this.currentTime);
    }

    this.animationFrameRequestId = requestAnimationFrame(this.step);
  }

  syncTimeChanged() {
    this.currentTime = this.model.get("sync_time");
    this.inputRangeProgress.value = (
      this.currentTime / this.model.get("duration")
    ).toFixed(2);
  }

  isRunningChanged() {
    this.btnTogglePlay.innerHTML = !this.model.get("is_running")
      ? this.model.get("icons").play
      : this.model.get("icons").pause;
  }

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

  render() {
    this.model.on("change:sync_time", this.syncTimeChanged.bind(this));
    this.model.on("change:is_running", this.isRunningChanged.bind(this));

    this.step = this.step.bind(this);
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
