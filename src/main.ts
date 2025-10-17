import "./style.css";

const title = document.createElement("h1");
title.textContent = "D2 Paint!";
title.style.textAlign = "center";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);
