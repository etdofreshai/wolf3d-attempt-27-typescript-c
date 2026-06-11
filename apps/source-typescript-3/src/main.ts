const canvas = document.querySelector<HTMLCanvasElement>("#screen");

if (canvas === null) {
  throw new Error("Missing #screen canvas");
}

const context = canvas.getContext("2d");

if (context === null) {
  throw new Error("2D canvas context unavailable");
}

context.fillStyle = "#111111";
context.fillRect(0, 0, canvas.width, canvas.height);
context.fillStyle = "#f2f2f2";
context.font = "16px monospace";
context.textBaseline = "middle";
context.textAlign = "center";
context.fillText("Wolf3D TypeScript port scaffold", canvas.width / 2, canvas.height / 2);
