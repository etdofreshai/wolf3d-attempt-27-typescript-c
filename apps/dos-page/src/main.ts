import "./styles.css";
import { createOriginalDosRunner } from "./originalDos";
import { createWolfDosApp } from "./wolfDos";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root.");
}

root.innerHTML = `
  <div class="page-stack">
    <section id="original-root"></section>
    <section id="probe-root"></section>
  </div>
`;

const originalRoot = root.querySelector<HTMLElement>("#original-root");
const probeRoot = root.querySelector<HTMLElement>("#probe-root");

if (!originalRoot || !probeRoot) {
  throw new Error("Missing app sections.");
}

createOriginalDosRunner(originalRoot);
createWolfDosApp(probeRoot);
