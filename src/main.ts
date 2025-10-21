import "./style.css";

const title = document.createElement("h1");
title.textContent = "D2 Paint!";
title.style.textAlign = "center";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2d not suposoed ");
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.lineWidth = 2;

type Pt = { x: number; y: number };

const strokes: Pt[][] = [];
let currentStroke: Pt[] | null = null;

const redoStack: Pt[][] = [];

const dispatchChanged = () => {
  canvas.dispatchEvent(new Event("drawing-changed"));
};

const redraw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;

    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      const p = stroke[i];
      ctx.lineTo(p.x, p.y);
    }
  }
  ctx.stroke();
};

const controls = document.createElement("div");
controls.style.display = "grid";
controls.style.gridAutoFlow = "column";
controls.style.gap = "0.5rem";
controls.style.justifyContent = "center";
controls.style.margin = "1rem 0";
document.body.append(controls);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";

controls.append(undoButton, redoButton, clearBtn);

const updateButtonStates = () => {
  undoButton.disabled = strokes.length === 0;
  redoButton.disabled = redoStack.length === 0;
};

canvas.addEventListener("drawing-changed", () => {
  redraw();
  updateButtonStates();
});

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentStroke = [{ x: cursor.x, y: cursor.y }];
  strokes.push(currentStroke);
  redoStack.length = 0;
  dispatchChanged();
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentStroke) return;
  const x = e.offsetX;
  const y = e.offsetY;
  currentStroke.push({ x, y });
  cursor.x = x;
  cursor.y = y;
  dispatchChanged();
});

const endStroke = () => {
  cursor.active = false;
  currentStroke = null;
};

canvas.addEventListener("mouseup", endStroke);
canvas.addEventListener("mouseleave", endStroke);

undoButton.addEventListener("click", () => {
  if (strokes.length === 0) return;
  const popped = strokes.pop()!;
  redoStack.push(popped);
  dispatchChanged();
});

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const popped = redoStack.pop()!;
  strokes.push(popped);
  dispatchChanged();
});

clearBtn.addEventListener("click", () => {
  strokes.length = 0;
  redoStack.length = 0;
  dispatchChanged();
});

dispatchChanged();
