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

interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Draggable {
  drag(x: number, y: number): void;
}

class LineCommand implements DisplayCommand, Draggable {
  private points: Pt[] = [];
  private width: number;

  constructor(initial: Pt, width: number) {
    this.points.push(initial);
    this.width = width;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.save();
    ctx.lineWidth = this.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

const displayList: DisplayCommand[] = [];
let currentCommand: (DisplayCommand & Draggable) | null = null;
const redoStack: DisplayCommand[] = [];

const dispatchChanged = () => {
  canvas.dispatchEvent(new Event("drawing-changed"));
};

const redraw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of displayList) cmd.display(ctx);
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
  undoButton.disabled = displayList.length === 0;
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

  currentCommand = new LineCommand({ x: cursor.x, y: cursor.y }, 2);
  displayList.push(currentCommand);
  redoStack.length = 0;
  dispatchChanged();
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentCommand) return;
  const x = e.offsetX;
  const y = e.offsetY;
  currentCommand.drag(x, y);
  cursor.x = x;
  cursor.y = y;
  dispatchChanged();
});

const endStroke = () => {
  cursor.active = false;
  currentCommand = null;
};

canvas.addEventListener("mouseup", endStroke);
canvas.addEventListener("mouseleave", endStroke);

undoButton.addEventListener("click", () => {
  if (displayList.length === 0) return;
  const popped = displayList.pop()!;
  redoStack.push(popped);
  dispatchChanged();
});

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const popped = redoStack.pop()!;
  displayList.push(popped);
  dispatchChanged();
});

clearBtn.addEventListener("click", () => {
  displayList.length = 0;
  redoStack.length = 0;
  dispatchChanged();
});

dispatchChanged();
