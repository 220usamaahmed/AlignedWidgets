import type { RenderProps } from "@anywidget/types";
import "./styles/widget.css";
import buttonTemplate from "./templates/widget.html";

interface WidgetModel {
  value: number;
}

function render({ model, el }: RenderProps<WidgetModel>) {
  // Use the imported HTML template
  el.innerHTML = buttonTemplate;

  // Find elements in the template
  const btn = el.querySelector("button") as HTMLButtonElement;
  const valueSpan = el.querySelector(".value") as HTMLSpanElement;

  // Initialize
  if (valueSpan) valueSpan.textContent = model.get("value").toString();

  if (btn) {
    btn.addEventListener("click", () => {
      model.set("value", model.get("value") + 2);
      model.save_changes();
    });
  }

  model.on("change:value", () => {
    if (valueSpan) valueSpan.textContent = model.get("value").toString();
  });

  el.classList.add("aligned_widgets");
}

export default { render };
