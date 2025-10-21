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
canvas.addEventListener("drawing-changed", redraw);
const cursor = { active: false, x: 0, y: 0 };
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  currentStroke = [{ x: cursor.x, y: cursor.y }];
  strokes.push(currentStroke);
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
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.append(clearButton);
clearButton.addEventListener("click", () => {
  strokes.length = 0;
  dispatchChanged();
});
dispatchChanged();
