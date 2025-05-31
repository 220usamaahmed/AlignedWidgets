import type { AnyModel, RenderProps } from "@anywidget/types";
import "./styles/widget.css";
import "./styles/timeseries_widget.css";
import timeseriesTemplate from "./templates/timeseries_widget.html";

interface TimerseriesWidgetModel {
  is_running: boolean;
  sync_time: number;
  times: Float64Array;
  values: Float64Array;
  channel_names: string[];
  title: string;
}

class TimeseriesWidget {
  el: HTMLElement;
  model: AnyModel<TimerseriesWidgetModel>;

  canvas: HTMLCanvasElement;

  currentTime: number;
  lastAnimationFrameTimestamp: DOMHighResTimeStamp | null = null;
  animationFrameRequestId: number | null = null;

  times: Float64Array;
  values: Float64Array[] = [];
  numChannels: number;

  window_size_in_s = 5;

  constructor({ model, el }: RenderProps<TimerseriesWidgetModel>) {
    this.model = model;
    this.el = el;
    el.innerHTML = timeseriesTemplate;

    this.canvas = el.querySelector("#canvas")!;

    this.currentTime = this.model.get("sync_time");

    const times_bytes = this.model.get("times");
    const times_buffer = times_bytes.buffer || times_bytes;
    this.times = new Float64Array(times_buffer);

    const values_bytes = this.model.get("values");
    const values_buffer = values_bytes.buffer || values_bytes;
    const all_values = new Float64Array(values_buffer);

    const num_elements = this.times.length;
    const total_values_count = all_values.length;
    this.numChannels = total_values_count / num_elements;

    for (let i = 0; i < this.numChannels; i++) {
      this.values.push(
        all_values.slice(i * num_elements, i * num_elements + num_elements)
      );
    }

    this.addLegend();
    this.addTitle();
  }

  addLegend() {
    const legend = this.el.querySelector("#legend")!;

    for (const channel of this.model.get("channel_names")) {
      const channelIndex = this.model
        .get("channel_names")
        .findIndex((e) => e == channel);
      const label = document.createElement("span");
      label.innerHTML = channel;
      label.style.setProperty("--line-color", this.getColor(channelIndex));
      legend.append(label);
    }
  }

  addTitle() {
    const title = this.el.querySelector("#title")!;
    title.innerHTML = this.model.get("title");
  }

  getColor(channelIndex: number) {
    const colors = [
      "#F44336",
      "#4CAF50",
      "#2196F3",
      "#FFEB3B",
      "#795548",
      "#673AB7",
    ];

    const index = channelIndex % colors.length;

    return colors[index];
  }

  step(timestamp: DOMHighResTimeStamp) {
    if (!this.lastAnimationFrameTimestamp) {
      const canvasHolder = this.el.querySelector("#canvas-holder")!;
      this.canvas.width = canvasHolder.clientWidth;
      this.canvas.height = canvasHolder.clientHeight;
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";

      this.lastAnimationFrameTimestamp = timestamp;
    }

    const delta = timestamp - this.lastAnimationFrameTimestamp;
    this.lastAnimationFrameTimestamp = timestamp;

    if (this.model.get("is_running")) {
      const duration = this.times[this.times.length - 1];
      this.currentTime = Math.min(this.currentTime + delta / 1000, duration);
    }

    this.drawPlots();

    this.animationFrameRequestId = requestAnimationFrame(this.step);
  }

  drawPlots() {
    const startTime = this.currentTime - this.window_size_in_s / 2;
    const endTime = this.currentTime + this.window_size_in_s / 2;

    const startIndex = this.times.findIndex((e) => e > startTime);
    const endIndexPlus1 = this.times.findIndex((e) => e > endTime);

    const endIndex =
      endIndexPlus1 != -1
        ? Math.max(endIndexPlus1 - 1, 0)
        : this.times.length - 1;

    const firstPointTimeDelta = this.times[startIndex] - this.currentTime;
    const lastPointTimeDelta = this.times[endIndex] - this.currentTime;
    const leftOffsetPercentage = Math.max(
      firstPointTimeDelta / this.window_size_in_s + 0.5,
      0
    );
    const rightOffsetPercentage =
      lastPointTimeDelta / this.window_size_in_s + 0.5;

    this.drawGraphFrame();

    for (let c = 0; c < this.numChannels; c++) {
      this.drawPlot(
        c,
        startIndex,
        endIndex,
        leftOffsetPercentage,
        rightOffsetPercentage,
        -1,
        1
      );
    }
  }

  drawPlot(
    channelIndex: number,
    startIndex: number,
    endIndex: number,
    leftOffsetPercentage: number,
    rightOffsetPercentage: number,
    min: number,
    max: number
  ) {
    if (isNaN(startIndex) || isNaN(endIndex)) return;

    const ctx = this.canvas.getContext("2d");
    const width = this.canvas.width;
    const height = this.canvas.height;

    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }

    ctx.strokeStyle = this.getColor(channelIndex);
    ctx.lineWidth = 2;

    ctx.beginPath();

    const indexRange = endIndex - startIndex;
    const fullWidthRange = width - 2;
    const startX = leftOffsetPercentage * fullWidthRange;
    const endX = rightOffsetPercentage * fullWidthRange;
    const widthRange = endX - startX;
    const heightRange = height - 2;
    const yRange = max - min;

    const values = this.values[channelIndex];

    ctx.moveTo(
      startX,
      height - (heightRange * (values[startIndex] - min)) / yRange
    );

    const max_points_to_display = width;
    const di =
      indexRange > max_points_to_display
        ? Math.floor(indexRange / max_points_to_display)
        : 1;

    for (let i = startIndex; i <= endIndex; i += di) {
      const x = ((i - startIndex) / indexRange) * widthRange + startX;
      const y = height - (heightRange * (values[i] - min)) / yRange;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  drawGraphFrame() {
    const ctx = this.canvas.getContext("2d");
    const width = this.canvas.width;
    const height = this.canvas.height;

    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "#607d8b";

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
  }

  syncTimeChanged() {
    this.currentTime = this.model.get("sync_time");
  }

  isRunningChanged() {}

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
  render(props: RenderProps<TimerseriesWidgetModel>) {
    const widget = new TimeseriesWidget(props);
    widget.render();
    return () => widget.destroy();
  },
};
