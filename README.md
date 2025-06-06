# Aligned Widgets

A set of Jupyter Notebook widgets which let you visualize synchronized
multimodal data.

## Installation

```bash
pip install aligned-widgets
```

## Usage

To use inside of your notebook use the following code after installing

```python  
from aligned_widgets import *
import numpy as np
````

```python
T = 10

times = np.arange(0, T, 0.01)
values = np.vstack([
  times * np.sin(times * np.pi * 2),
  np.cos(times * np.pi * 2),
  np.cos(times * np.pi * 1)
])

annotations = [
    {"start": 1, "end": 2, "tags": ["a", "b"]},
    {"start": 2.1, "end": 5, "tags": ["b"]},
    {"start": 6.5, "end": 7, "tags": ["b", "c"]},
]
```

```python
v = VideoWidget("/Users/usama/Projects/AlignedWidgets/examples/dummy_video.mp4")
ts = TimeseriesWidget(
    times, 
    values,
    tags=["a", "b", "c"],
    annotations=annotations,
    channel_names=["sin", "cos", "cos2"], 
    title="Trig Functions",
    y_range=(-2, None)
)
c = ControlWidget(T)

a = align(c, v, ts)
display(v, ts, c)
```

```python
# View annotations
print(ts.annotations)
```

```python
# Unlink
unalign(a)
```  
