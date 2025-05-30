import type { AnyModel, RenderProps } from "@anywidget/types";
import "./styles/widget.css";
import "./styles/timeseries_widget.css";
import timeseriesTemplate from "./templates/timeseries_widget.html";

interface TimerseriesWidgetModel {
  is_running: boolean;
  sync_time: number;
  times: Float64Array;
  values: Float64Array;
}

class TimeseriesWidget {
  el: HTMLElement;
  model: AnyModel<TimerseriesWidgetModel>;

  currentTime: number;
  lastAnimationFrameTimestamp: DOMHighResTimeStamp | null = null;
  animationFrameRequestId: number | null = null;

  times: Float64Array;
  values: Float64Array[] = [];

  constructor({ model, el }: RenderProps<TimerseriesWidgetModel>) {
    this.model = model;
    this.el = el;

    this.currentTime = this.model.get("sync_time");

    const times_bytes = this.model.get("times");
    const times_buffer = times_bytes.buffer || times_bytes;
    this.times = new Float64Array(times_buffer);

    const values_bytes = this.model.get("values");
    const values_buffer = values_bytes.buffer || values_bytes;
    const all_values = new Float64Array(values_buffer);

    const num_elements = this.times.length;
    const total_values_count = all_values.length;
    const num_channels = total_values_count / num_elements;

    for (let i = 0; i < num_channels; i++) {
      this.values.push(
        all_values.slice(i * num_elements, i * num_elements + num_elements)
      );
    }
  }

  step(timestamp: DOMHighResTimeStamp) {
    this.animationFrameRequestId = requestAnimationFrame(this.step);
  }

  syncTimeChanged() {}

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
