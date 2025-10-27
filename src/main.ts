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

let currentThickness = 2;
const THIN = 2;
const THICK = 8;

type Tool = "marker" | "sticker";
let currentTool: Tool = "marker";

const STICKERS = ["🙌", "😎", "👾"];
let selsectedSticker = STICKERS[0];
let stickerSize = 32;

const thinButton = document.createElement("button");
thinButton.textContent = "Thin";

const thickButton = document.createElement("button");
thickButton.textContent = "Thick";

function updateToolSelection() {
  thinButton.classList.toggle("selectedTool", currentThickness === THIN);
  thickButton.classList.toggle("selectedTool", currentThickness === THICK);
  canvas.dispatchEvent(new Event("tool-moved"));
}

function makeMarkerPreview(): Preview {
  return new MarkerPreview(
    () => ({ x: cursor.x, y: cursor.y }),
    () => currentThickness,
  );
}

type Pt = { x: number; y: number };

interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Draggable {
  drag(x: number, y: number): void;
}

interface Preview {
  draw(ctx: CanvasRenderingContext2D): void;
}

let preview: Preview | null = null;

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

class MarkerPreview implements Preview {
  constructor(private getPos: () => Pt, private getWidth: () => number) {}

  draw(ctx: CanvasRenderingContext2D) {
    const p = this.getPos();
    const r = Math.max(1, this.getWidth() / 2);

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

class StickerPreview implements Preview {
  constructor(
    private getPos: () => Pt,
    private getEmoji: () => string,
    private getSize: () => number,
  ) {}

  draw(ctx: CanvasRenderingContext2D) {
    const p = this.getPos();
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font =
      "${this.size}px system-ui, Congrats Emoji, Cool emoji, alien emoji";
    ctx.fillText(this.getEmoji(), p.x, p.y);
    ctx.restore();
  }
}

class StickerCommand implements DisplayCommand, Draggable {
  constructor(
    public x: number,
    public y: number,
    private emoji: string,
    private size: number,
  ) {}

  drag(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "${this.size}px system-ui, sans-serif";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

const displayList: DisplayCommand[] = [];
let currentCommand: (DisplayCommand & Draggable) | null = null;
const redoStack: DisplayCommand[] = [];

const dispatchChanged = () => {
  canvas.dispatchEvent(new Event("tool-moved"));
};

const redraw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of displayList) cmd.display(ctx);
  if (!cursor.active && preview) preview.draw(ctx);
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

controls.append(undoButton, redoButton, clearBtn, thinButton, thickButton);

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
  preview = null;

  if (currentTool === "marker") {
    currentCommand = new LineCommand(
      { x: cursor.x, y: cursor.y },
      currentThickness,
    );
  } else {
    currentCommand = new StickerCommand(
      cursor.x,
      cursor.y,
      selsectedSticker,
      stickerSize,
    );
  }

  displayList.push(currentCommand);
  redoStack.length = 0;
  dispatchChanged();
});

canvas.addEventListener("mousemove", (e) => {
  const x = e.offsetX, y = e.offsetY;
  cursor.x = x;
  cursor.y = y;

  if (!cursor.active) {
    canvas.dispatchEvent(new Event("tool-moved"));
    return;
  }

  if (currentCommand) {
    currentCommand.drag(x, y);
    dispatchChanged();
  }
});

const endStroke = () => {
  cursor.active = false;
  currentCommand = null;
  canvas.dispatchEvent(new Event("tool-moved"));
};

canvas.addEventListener("mouseup", endStroke);
canvas.addEventListener("mouseleave", endStroke);

const stickerBar = document.createElement("div");
for (const s of STICKERS) {
  const b = document.createElement("button");
  b.textContent = s;
  b.addEventListener("click", () => {
    currentTool = "sticker";
    selsectedSticker = s;
    canvas.dispatchEvent(new Event("tool-moved"));
    updateToolSelection();
  });
  stickerBar.append(b);
}
controls.prepend(stickerBar);

canvas.addEventListener("tool-moved", () => {
  if (currentTool === "marker") {
    preview = makeMarkerPreview();
  } else {
    preview = new StickerPreview(
      () => ({ x: cursor.x, y: cursor.y }),
      () => selsectedSticker,
      () => stickerSize,
    );
  }
  redraw();
});

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

thinButton.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = THIN;
  updateToolSelection();
  canvas.dispatchEvent(new Event("tool-moved"));
});

thickButton.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = THICK;
  updateToolSelection();
  canvas.dispatchEvent(new Event("tool-moved"));
});

dispatchChanged();
