# Aligned Widgets

A set of Jupyter Notebook widgets which let you visualize synchronized
multimodal data.

## Usage

To use inside of your notebook use the following code after installing

```python
  
# Imports
from aligned_widgets import *
import numpy as np

# Data
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

# Create and display widgets
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

# View annotations
print(ts.annotations)

# Unlink
unalign(a)
  
```

# Development

## Installation

```sh
pip install aligned_widgets
```

or with [uv](https://github.com/astral-sh/uv):

```sh
uv add aligned_widgets
```

## Development

We recommend using [uv](https://github.com/astral-sh/uv) for development.
It will automatically manage virtual environments and dependencies for you.

```sh
uv run jupyter lab example.ipynb
```

Alternatively, create and manage your own virtual environment:

```sh
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
jupyter lab example.ipynb
```

The widget front-end code bundles it's JavaScript dependencies. After setting up Python,
make sure to install these dependencies locally:

```sh
npm install
```

While developing, you can run the following in a separate terminal to automatically
rebuild JavaScript as you make changes:

```sh
npm run dev
```

Open `example.ipynb` in JupyterLab, VS Code, or your favorite editor
to start developing. Changes made in `js/` will be reflected
in the notebook.
