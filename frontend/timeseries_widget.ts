import type { AnyModel, RenderProps } from '@anywidget/types';
import './styles/widget.css';
import './styles/timeseries_widget.css';
import timeseriesTemplate from './templates/timeseries_widget.html';

type Annotation = {
  start: number;
  end: number;
  tags: string[];
};

type YRange = {
  min: number | null;
  max: number | null;
};

interface TimerseriesWidgetModel {
  is_running: boolean;
  sync_time: number;
  times: Float64Array;
  values: Float64Array;
  tags: string[];
  annotations: Annotation[];
  channel_names: string[];
  title: string;
  y_range: YRange;
  x_range: number;
  icons: {
    add: string;
    delete: string;
    zoom_in: string;
    zoom_out: string;
  };
}

class TimeseriesWidget {
  el: HTMLElement;
  model: AnyModel<TimerseriesWidgetModel>;

  canvas: HTMLCanvasElement;
  btnAdd: HTMLButtonElement;
  btnDelete: HTMLButtonElement;
  btnZoomIn: HTMLButtonElement;
  btnZoomOut: HTMLButtonElement;
  btnToggleTagsList: HTMLButtonElement;
  tagsList: HTMLDivElement;
  tagInputElements: HTMLInputElement[] = [];

  currentTime: number;
  lastAnimationFrameTimestamp: DOMHighResTimeStamp | null = null;
  animationFrameRequestId: number | null = null;

  times: Float64Array;
  values: Float64Array[] = [];
  numChannels: number;
  yRange: YRange;
  annotations: Annotation[] = [];
  tags: string[] = [];

  windowSizeInSec = 5;
  selectedAnnIndex: number | null = null;
  selectedResizingHandle: {
    annIndex: number;
    side: 'left' | 'right';
  } | null = null;
  selectedMoveHandle: {
    annIndex: number;
    grabX: number;
    annStart: number;
    annEnd: number;
  } | null = null;

  constructor({ model, el }: RenderProps<TimerseriesWidgetModel>) {
    this.model = model;
    this.el = el;
    el.innerHTML = timeseriesTemplate;

    this.canvas = el.querySelector('#canvas')!;
    this.canvas.addEventListener('mousedown', this.canvasMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.canvasMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.canvasMouseUp.bind(this));

    this.btnAdd = el.querySelector('#btnAdd')!;
    this.btnAdd.innerHTML = this.model.get('icons').add;
    this.btnAdd.addEventListener('click', this.btnAddClicked.bind(this));

    this.btnDelete = el.querySelector('#btnDelete')!;
    this.btnDelete.innerHTML = this.model.get('icons').delete;
    this.btnDelete.addEventListener('click', this.btnDeleteClicked.bind(this));

    this.btnZoomIn = el.querySelector('#btnZoomIn')!;
    this.btnZoomIn.innerHTML = this.model.get('icons').zoom_in;
    this.btnZoomIn.addEventListener('click', this.btnZoomInClicked.bind(this));

    this.btnZoomOut = el.querySelector('#btnZoomOut')!;
    this.btnZoomOut.innerHTML = this.model.get('icons').zoom_out;
    this.btnZoomOut.addEventListener(
      'click',
      this.btnZoomOutClicked.bind(this)
    );

    this.btnToggleTagsList = el.querySelector('#btnToggleTagsList')!;
    this.btnToggleTagsList.addEventListener(
      'click',
      this.toggleTagsList.bind(this)
    );

    this.tagsList = el.querySelector('#tagsList')!;

    this.currentTime = this.model.get('sync_time');

    const times_bytes = this.model.get('times');
    const times_buffer = times_bytes.buffer || times_bytes;
    this.times = new Float64Array(times_buffer);

    const values_bytes = this.model.get('values');
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

    this.annotations = this.model.get('annotations');
    this.yRange = this.model.get('y_range');
    this.windowSizeInSec = this.model.get('x_range');
    this.tags = this.model.get('tags');

    this.populateTagsList();
    this.addLegend();
    this.addTitle();
  }

  populateTagsList() {
    for (let i = 0; i < this.tags.length; i++) {
      const tag = this.tags[i];

      const label = document.createElement('label');
      const inputCheckbox = document.createElement('input');
      const labelText = document.createTextNode(tag);

      inputCheckbox.type = 'checkbox';
      inputCheckbox.value = tag;
      inputCheckbox.style.setProperty('--checkbox-color', this.getTagColor(i));
      inputCheckbox.addEventListener('change', this.tagToggled.bind(this));

      label.appendChild(inputCheckbox);
      label.appendChild(labelText);

      this.tagInputElements.push(inputCheckbox);
      this.tagsList.appendChild(label);
    }
  }

  tagToggled(e: Event) {
    if (this.selectedAnnIndex == null) return;

    const target = e.target as HTMLInputElement;
    const ann = this.annotations[this.selectedAnnIndex];

    if (target.checked) {
      ann.tags.push(target.value);
    } else {
      ann.tags = ann.tags.filter(t => t !== target.value);
    }

    this.syncAnnotations();
  }

  canvasMouseDown(e: MouseEvent) {
    if (this.checkForHandleSelection(e.offsetX)) {
      return;
    }

    if (this.checkForAnnSelection(e.offsetX)) {
      this.updateTagCheckboxes();
      this.btnToggleTagsList.classList.add('show');
    } else {
      this.btnToggleTagsList.classList.remove('show');
      this.tagsList.classList.remove('show');
    }
  }

  updateTagCheckboxes() {
    if (this.selectedAnnIndex == null) return;
    const tags = this.annotations[this.selectedAnnIndex].tags;

    for (const checkbox of this.tagInputElements) {
      checkbox.checked = tags.includes(checkbox.value);
    }
  }

  canvasMouseMove(e: MouseEvent) {
    if (this.selectedResizingHandle != null) {
      this.resizeAnnotation(e.offsetX);
    } else if (this.selectedMoveHandle != null) {
      this.moveAnnotation(e.offsetX);
    }
  }

  resizeAnnotation(mouseX: number) {
    if (this.selectedResizingHandle == null) return;

    const width = this.canvas.width;
    const time =
      this.currentTime + (this.windowSizeInSec * (mouseX - width / 2)) / width;

    if (this.selectedResizingHandle.side == 'left') {
      this.annotations[this.selectedResizingHandle.annIndex].start = time;
    } else {
      this.annotations[this.selectedResizingHandle.annIndex].end = time;
    }
  }

  moveAnnotation(mouseX: number) {
    if (this.selectedMoveHandle == null) return;

    const width = this.canvas.width;
    const offsetTime =
      (this.windowSizeInSec * (mouseX - this.selectedMoveHandle.grabX)) / width;
    this.annotations[this.selectedMoveHandle.annIndex].start =
      this.selectedMoveHandle.annStart + offsetTime;
    this.annotations[this.selectedMoveHandle.annIndex].end =
      this.selectedMoveHandle.annEnd + offsetTime;
  }

  canvasMouseUp() {
    this.selectedResizingHandle = null;
    this.selectedMoveHandle = null;
    this.syncAnnotations();
  }

  btnAddClicked() {
    this.annotations.push({
      start: this.currentTime,
      end: this.currentTime + 0.5,
      tags: [],
    });

    this.selectedAnnIndex = this.annotations.length - 1;

    this.syncAnnotations();
  }

  btnDeleteClicked() {
    if (this.selectedAnnIndex == null) return;

    this.annotations.splice(this.selectedAnnIndex, 1);
    this.selectedAnnIndex = null;

    this.syncAnnotations();
  }

  btnZoomInClicked() {
    this.windowSizeInSec -= 0.5;
  }

  btnZoomOutClicked() {
    this.windowSizeInSec += 0.5;
  }

  toggleTagsList() {
    this.tagsList.classList.toggle('show');
  }

  syncAnnotations() {
    this.model.set('annotations', []);
    this.model.set('annotations', [...this.annotations]);
    this.model.save_changes();
  }

  checkForAnnSelection(mouseX: number) {
    const startTime = this.currentTime - this.windowSizeInSec / 2;
    const endTime = this.currentTime + this.windowSizeInSec / 2;

    const drawnAnns = this.getAnnotationsToDraw(startTime, endTime);

    this.selectedAnnIndex = null;
    for (let i = 0; i < drawnAnns.length; i++) {
      const ann = drawnAnns[i];
      if (ann.start > mouseX || ann.start + ann.width < mouseX) continue;
      this.selectedAnnIndex = ann.index;
      return true;
    }

    return false;
  }

  checkForHandleSelection(mouseX: number) {
    const startTime = this.currentTime - this.windowSizeInSec / 2;
    const endTime = this.currentTime + this.windowSizeInSec / 2;

    const drawnAnns = this.getAnnotationsToDraw(startTime, endTime);

    this.selectedResizingHandle = null;
    this.selectedMoveHandle = null;
    for (let i = 0; i < drawnAnns.length; i++) {
      const ann = drawnAnns[i];

      // Check for left handle
      if (Math.abs(mouseX - ann.start) < 6) {
        this.selectedResizingHandle = {
          annIndex: ann.index,
          side: 'left',
        };
        return true;
      }

      // Check for right handle
      if (Math.abs(mouseX - ann.start - ann.width) < 6) {
        this.selectedResizingHandle = {
          annIndex: ann.index,
          side: 'right',
        };
        return true;
      }

      // Move handle
      if (mouseX > ann.start && mouseX < ann.start + ann.width) {
        this.selectedMoveHandle = {
          annIndex: ann.index,
          grabX: mouseX,
          annStart: this.annotations[ann.index].start,
          annEnd: this.annotations[ann.index].end,
        };
      }
    }

    return false;
  }

  addLegend() {
    const legend = this.el.querySelector('#legend')!;

    for (const channel of this.model.get('channel_names')) {
      const channelIndex = this.model
        .get('channel_names')
        .findIndex(e => e == channel);
      const label = document.createElement('span');
      label.innerHTML = channel;
      label.style.setProperty('--line-color', this.getPlotColor(channelIndex));
      legend.append(label);
    }
  }

  addTitle() {
    const title = this.el.querySelector('#title')!;
    title.innerHTML = this.model.get('title');
  }

  getPlotColor(channelIndex: number) {
    const colors = [
      '#F44336',
      '#4CAF50',
      '#2196F3',
      '#FFEB3B',
      '#795548',
      '#673AB7',
    ];

    const index = channelIndex % colors.length;

    return colors[index];
  }

  getTagColor(tagIndex: number) {
    const colors = [
      '#F44336',
      '#3F51B5',
      '#00BCD4',
      '#9C27B0',
      '#E91E63',
      '#CDDC39',
      '#795548',
      '#FFEB3B',
      '#607D8B',
      '#2196F3',
    ];

    const index = tagIndex % colors.length;

    return colors[index];
  }

  step(timestamp: DOMHighResTimeStamp) {
    if (!this.lastAnimationFrameTimestamp) {
      const canvasHolder = this.el.querySelector('#canvas-holder')!;
      this.canvas.width = canvasHolder.clientWidth;
      this.canvas.height = canvasHolder.clientHeight;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';

      this.lastAnimationFrameTimestamp = timestamp;
    }

    const delta = timestamp - this.lastAnimationFrameTimestamp;
    this.lastAnimationFrameTimestamp = timestamp;

    if (this.model.get('is_running')) {
      const duration = this.times[this.times.length - 1];
      this.currentTime = Math.min(this.currentTime + delta / 1000, duration);
    }

    this.clearFrame();
    this.draw();

    this.animationFrameRequestId = requestAnimationFrame(this.step);
  }

  draw() {
    const startTime = this.currentTime - this.windowSizeInSec / 2;
    const endTime = this.currentTime + this.windowSizeInSec / 2;

    const startIndex = this.times.findIndex(e => e >= startTime);
    const endIndexPlus1 = this.times.findIndex(e => e > endTime);

    const endIndex =
      endIndexPlus1 != -1
        ? Math.max(endIndexPlus1 - 1, 0)
        : this.times.length - 1;

    const firstPointTimeDelta = this.times[startIndex] - this.currentTime;
    const lastPointTimeDelta = this.times[endIndex] - this.currentTime;
    const leftOffsetPercentage = Math.max(
      firstPointTimeDelta / this.windowSizeInSec + 0.5,
      0
    );
    const rightOffsetPercentage =
      lastPointTimeDelta / this.windowSizeInSec + 0.5;

    this.drawAnnotations(startTime, endTime);

    for (let c = 0; c < this.numChannels; c++) {
      this.drawPlot(
        c,
        startIndex,
        endIndex,
        leftOffsetPercentage,
        rightOffsetPercentage
      );
    }
  }

  getRange(startIndex: number, endIndex: number) {
    let min = this.yRange.min;
    let max = this.yRange.max;

    if (min != null && max != null) return { min, max };

    const mins = [];
    const maxs = [];

    for (let c = 0; c < this.numChannels; c++) {
      if (min == null) {
        mins.push(Math.min(...this.values[c].slice(startIndex, endIndex + 1)));
      }
      if (max == null) {
        maxs.push(Math.max(...this.values[c].slice(startIndex, endIndex + 1)));
      }
    }

    return {
      min: min ? min : Math.min(...mins),
      max: max ? max : Math.max(...maxs),
    };
  }

  drawPlot(
    channelIndex: number,
    startIndex: number,
    endIndex: number,
    leftOffsetPercentage: number,
    rightOffsetPercentage: number
  ) {
    if (isNaN(startIndex) || isNaN(endIndex)) return;

    const ctx = this.canvas.getContext('2d');
    const width = this.canvas.width;
    const height = this.canvas.height;

    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }

    ctx.strokeStyle = this.getPlotColor(channelIndex);
    ctx.lineWidth = 2;

    ctx.beginPath();

    const indexRange = endIndex - startIndex;
    const fullWidthRange = width;
    const startX = leftOffsetPercentage * fullWidthRange;
    const endX = rightOffsetPercentage * fullWidthRange;
    const widthRange = endX - startX;
    const heightRange = height;
    const { min, max } = this.getRange(startIndex, endIndex);
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

    for (
      let i = Math.max(0, startIndex - di);
      i < Math.min(values.length, endIndex + 2 * di);
      i += di
    ) {
      const x = ((i - startIndex) / indexRange) * widthRange + startX;
      const y = height - (heightRange * (values[i] - min)) / yRange;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  getAnnotationsToDraw(startTime: number, endTime: number) {
    let annotationsToDraw = [];

    const width = this.canvas.width;

    const leftOffsetPercentage = 0;
    const rightOffsetPercentage = 1;

    const fullWidthRange = width;
    const startX = fullWidthRange * leftOffsetPercentage;
    const endX = fullWidthRange * rightOffsetPercentage;
    const widthRange = endX - startX;
    const timeRange = endTime - startTime;

    for (let i = 0; i < this.annotations.length; i++) {
      const ann = this.annotations[i];
      if (
        (ann.start >= startTime && ann.start <= endTime) ||
        (ann.end >= startTime && ann.end <= endTime) ||
        (ann.start <= startTime && ann.end >= endTime)
      ) {
        const start =
          (widthRange * (Math.max(ann['start'], startTime) - startTime)) /
          timeRange;
        const end =
          (widthRange * (Math.min(ann['end'], endTime) - startTime)) /
          timeRange;

        annotationsToDraw.push({
          start: startX + start,
          width: end - start,
          tagIndexes: ann.tags.map(t => this.tags.indexOf(t)),
          index: i,
        });
      }
    }

    return annotationsToDraw;
  }

  drawAnnotations(startTime: number, endTime: number) {
    const ctx = this.canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }

    const height = this.canvas.height;
    const indicatorPadding = 2;
    const indicatorHeight = 5;

    const annotationsToDraw = this.getAnnotationsToDraw(startTime, endTime);

    for (let i = 0; i < annotationsToDraw.length; i++) {
      const ann = annotationsToDraw[i];

      ctx.fillStyle = `#78909C${ann.index == this.selectedAnnIndex ? '44' : '22'}`;
      ctx.fillRect(ann.start, 0, ann.width, height);

      for (let i = 0; i < ann.tagIndexes.length; i++) {
        ctx.fillStyle = this.getTagColor(ann.tagIndexes[i]);
        ctx.fillRect(
          ann.start + indicatorPadding,
          indicatorPadding + i * indicatorHeight,
          ann.width - 2 * indicatorPadding,
          indicatorHeight - indicatorPadding
        );
      }

      if (this.selectedAnnIndex == ann.index) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#78909C';
        ctx.lineWidth = 4;

        // Left handle
        ctx.beginPath();
        ctx.moveTo(ann.start - 4, height / 2 - 12);
        ctx.lineTo(ann.start - 4, height / 2 + 12);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ann.start + 4, height / 2 - 12);
        ctx.lineTo(ann.start + 4, height / 2 + 12);
        ctx.stroke();

        // Right handle
        ctx.beginPath();
        ctx.moveTo(ann.start + ann.width - 4, height / 2 - 12);
        ctx.lineTo(ann.start + ann.width - 4, height / 2 + 12);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ann.start + ann.width + 4, height / 2 - 12);
        ctx.lineTo(ann.start + ann.width + 4, height / 2 + 12);
        ctx.stroke();
      }
    }
  }

  clearFrame() {
    const ctx = this.canvas.getContext('2d');
    const width = this.canvas.width;
    const height = this.canvas.height;

    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }

    ctx.clearRect(0, 0, width, height);

    this.drawAxis(ctx, width, height);
    this.drawXLabels(ctx, width, height);
  }

  drawAxis(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.strokeStyle = '#607d8b';

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // ctx.beginPath();
    // ctx.moveTo(width / 2, 0);
    // ctx.lineTo(width / 2, height);
    // ctx.stroke();
  }

  drawXLabels(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const ticksToDraw = 5;
    const ticksToDrawHalf = Math.floor(ticksToDraw);

    const middleTickTime =
      (this.windowSizeInSec / ticksToDraw) *
      Math.floor(this.currentTime / (this.windowSizeInSec / ticksToDraw));

    ctx.strokeStyle = '#B0BEC5';
    ctx.fillStyle = '#607d8b';
    ctx.font = '12px Arial';

    for (
      let i = -ticksToDrawHalf;
      i < ticksToDrawHalf + 1;
      i += this.windowSizeInSec / ticksToDraw
    ) {
      const tickTime = i + middleTickTime;
      const x = (width * (tickTime - this.currentTime)) / this.windowSizeInSec;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.fillText(
        (tickTime - this.windowSizeInSec / 2).toFixed(2),
        x + 4,
        height - 4
      );
    }
  }

  syncTimeChanged() {
    this.currentTime = this.model.get('sync_time');
  }

  isRunningChanged() {}

  render() {
    this.model.on('change:sync_time', this.syncTimeChanged.bind(this));
    this.model.on('change:is_running', this.isRunningChanged.bind(this));

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
