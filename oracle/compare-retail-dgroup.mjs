import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unlzexe } from "./unlzexe.mjs";

const repoRoot = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const layoutPath = path.join(repoRoot, "oracle", "generated", "dgroup-layout.json");
const mapPath = path.join(repoRoot, "source", "WOLFSRC", "WOLF3D.MAP");
const retailExePath = path.join(repoRoot, "steam", "base", "wolf3d.exe");
const rebuildCandidates = [
  path.join(repoRoot, "source", "WOLFSRC", "WOLF3D.EXE"),
  path.join(repoRoot, "source", "WOLFSRC", "OBJ", "WOLF3D.EXE"),
];

const LOCKED_RETAIL_SHA256 =
  "48d9594649f330956e86ea1892bab76b2d83cfd4038e262ff8f3383ba945ec09";

const dgroupClassNames = new Set(["DATA", "CONST", "INITDATA", "EXITDATA", "BSS", "BSSEND"]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function hex(value, width = 5) {
  return `0x${value.toString(16).toUpperCase().padStart(width, "0")}`;
}

function byteHex(value) {
  return `0x${value.toString(16).toUpperCase().padStart(2, "0")}`;
}

function parseHex(value) {
  if (typeof value === "number") return value;
  return Number.parseInt(String(value).replace(/^0x/i, "").replace(/H$/i, ""), 16);
}

function u16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

async function readDgroupLayout() {
  if (existsSync(layoutPath)) {
    const layout = JSON.parse(await readFile(layoutPath, "utf8"));
    return {
      source: path.relative(repoRoot, layoutPath).replaceAll("\\", "/"),
      segment: layout.dgroup.segment,
      dataStart: parseHex(layout.dgroup.dataStart),
      bssEnd: parseHex(layout.dgroup.bssEnd),
    };
  }

  const mapText = await readFile(mapPath, "utf8");
  const segments = [];
  let dgroupPublic = null;
  let inSegmentSummary = true;

  for (const line of mapText.split(/\r?\n/)) {
    if (line.includes("Detailed map of segments")) {
      inSegmentSummary = false;
    }

    if (inSegmentSummary) {
      const segment = line.match(
        /^\s*([0-9A-F]{5})H\s+([0-9A-F]{5})H\s+([0-9A-F]{5})H\s+(\S+)\s+(\S+)/,
      );
      if (segment) {
        segments.push({
          start: parseHex(segment[1]),
          stop: parseHex(segment[2]),
          className: segment[5],
        });
      }
    }

    const pub = line.match(/^\s*([0-9A-F]{4}):([0-9A-F]{4})\s+(?:idle\s+)?DATASEG@/);
    if (pub) {
      dgroupPublic = {
        segment: parseHex(pub[1]),
        offset: parseHex(pub[2]),
      };
    }
  }

  const dgroupSegments = segments.filter((segment) => dgroupClassNames.has(segment.className));
  if (!dgroupPublic || dgroupSegments.length === 0) {
    throw new Error(`Could not recover DGROUP from ${path.relative(repoRoot, mapPath)}`);
  }

  return {
    source: `${path.relative(repoRoot, mapPath).replaceAll("\\", "/")} (fallback parse)`,
    segment: hex(dgroupPublic.segment, 4),
    dataStart: Math.min(...dgroupSegments.map((segment) => segment.start)),
    bssEnd: Math.max(...dgroupSegments.map((segment) => segment.stop + 1)),
  };
}

function extractMzLoadImage(bytes, filePath) {
  if (bytes[0] !== 0x4d || bytes[1] !== 0x5a) {
    throw new Error(`${path.relative(repoRoot, filePath)} is not an MZ executable`);
  }

  const lastPageBytes = u16(bytes, 0x02);
  const pageCount = u16(bytes, 0x04);
  const headerBytes = u16(bytes, 0x08) * 16;
  const mzFileBytes = (pageCount - 1) * 512 + (lastPageBytes === 0 ? 512 : lastPageBytes);
  if (mzFileBytes > bytes.length || headerBytes > mzFileBytes) {
    throw new Error(`${path.relative(repoRoot, filePath)} has inconsistent MZ sizing`);
  }

  return {
    loadImage: bytes.subarray(headerBytes, mzFileBytes),
    fileBytes: bytes.length,
    mzFileBytes,
    headerBytes,
    debugTailBytes: bytes.length - mzFileBytes,
    cs: u16(bytes, 0x16),
    ip: u16(bytes, 0x14),
    ss: u16(bytes, 0x0e),
    sp: u16(bytes, 0x10),
  };
}

async function readRebuildImage() {
  const candidatePath = rebuildCandidates.find((candidate) => existsSync(candidate));
  if (!candidatePath) {
    return {
      found: false,
      reason: `no rebuild MZ found in ${rebuildCandidates
        .map((candidate) => path.relative(repoRoot, candidate).replaceAll("\\", "/"))
        .join(" or ")}`,
    };
  }

  const bytes = await readFile(candidatePath);
  return {
    found: true,
    path: path.relative(repoRoot, candidatePath).replaceAll("\\", "/"),
    ...extractMzLoadImage(bytes, candidatePath),
  };
}

function compareOverlap(retailImage, rebuild, dataStart, bssEnd) {
  const compareEnd = Math.min(retailImage.length, rebuild.loadImage.length, bssEnd);
  if (compareEnd <= dataStart) {
    return {
      performed: false,
      reason: `no shared bytes at MAP DGROUP start ${hex(dataStart)}`,
    };
  }

  const retailSlice = retailImage.subarray(dataStart, compareEnd);
  const rebuildSlice = rebuild.loadImage.subarray(dataStart, compareEnd);
  let diffCount = 0;
  let firstDiff = -1;
  for (let i = 0; i < retailSlice.length; i += 1) {
    if (retailSlice[i] !== rebuildSlice[i]) {
      diffCount += 1;
      if (firstDiff === -1) firstDiff = i;
    }
  }

  return {
    performed: true,
    rangeStart: dataStart,
    rangeEnd: compareEnd,
    bytes: retailSlice.length,
    equal: diffCount === 0,
    diffCount,
    firstDiff,
    firstDiffRetail: firstDiff === -1 ? null : retailSlice[firstDiff],
    firstDiffRebuild: firstDiff === -1 ? null : rebuildSlice[firstDiff],
    retailSha256: sha256(retailSlice),
    rebuildSha256: sha256(rebuildSlice),
  };
}

function printCoverage(retailImage, dgroup) {
  const mappedBytes = dgroup.bssEnd - dgroup.dataStart;
  const coveredEnd = Math.min(retailImage.length, dgroup.bssEnd);
  const coveredBytes = Math.max(0, coveredEnd - dgroup.dataStart);
  const coversMappedRange = retailImage.length >= dgroup.bssEnd;

  console.log(
    `MAP DGROUP: segment ${dgroup.segment}, dataStart ${hex(dgroup.dataStart)}, bssEnd ${hex(
      dgroup.bssEnd,
    )} (${mappedBytes} bytes)`,
  );
  console.log(
    `retail coverage of MAP DGROUP range: ${coversMappedRange ? "yes" : "no"}; ` +
      `${coveredBytes}/${mappedBytes} bytes available in decompressed image ` +
      `[${hex(dgroup.dataStart)}, ${hex(coveredEnd)})`,
  );
  if (!coversMappedRange) {
    console.log(
      "coverage note: bytes beyond the decompressed retail image are not byte-comparable here; " +
        "they require DOS zero-fill/runtime evidence or retail-symbol extraction.",
    );
  }
}

async function main() {
  const dgroup = await readDgroupLayout();
  const retailExe = await readFile(retailExePath);
  const retailPackedSha = sha256(retailExe);
  if (retailPackedSha !== LOCKED_RETAIL_SHA256) {
    throw new Error(`locked retail EXE hash mismatch: ${retailPackedSha}`);
  }

  const retailImage = unlzexe(retailExe);
  const retailImageSha = sha256(retailImage);
  const rebuild = await readRebuildImage();

  console.log("Retail DGROUP comparison (bounded)");
  console.log(`layout source: ${dgroup.source}`);
  console.log(
    `retail packed: steam/base/wolf3d.exe, ${retailExe.length} bytes, sha256 ${retailPackedSha} (locked)`,
  );
  console.log(`retail decompressed: ${retailImage.length} bytes, sha256 ${retailImageSha}`);
  printCoverage(retailImage, dgroup);

  if (!rebuild.found) {
    console.log(`rebuild comparison: skipped; ${rebuild.reason}`);
  } else {
    console.log(
      `rebuild image: ${rebuild.path}, MZ load ${rebuild.loadImage.length} bytes ` +
        `(file ${rebuild.fileBytes}, header ${rebuild.headerBytes}, debug tail ${rebuild.debugTailBytes})`,
    );
    console.log(
      `rebuild entry: CS:IP ${hex(rebuild.cs, 4)}:${hex(rebuild.ip, 4)}, ` +
        `SS:SP ${hex(rebuild.ss, 4)}:${hex(rebuild.sp, 4)}`,
    );

    const comparison = compareOverlap(retailImage, rebuild, dgroup.dataStart, dgroup.bssEnd);
    if (!comparison.performed) {
      console.log(`bounded rebuild comparison: skipped; ${comparison.reason}`);
    } else {
      console.log(
        `bounded rebuild comparison: ${comparison.bytes} bytes at MAP linear range ` +
          `[${hex(comparison.rangeStart)}, ${hex(comparison.rangeEnd)})`,
      );
      console.log(
        `bounded rebuild equality: ${comparison.equal ? "yes" : "no"}; ` +
          `diff bytes ${comparison.diffCount}/${comparison.bytes}`,
      );
      if (!comparison.equal) {
        console.log(
          `first diff: +${hex(comparison.firstDiff, 4)} ` +
            `(retail ${byteHex(comparison.firstDiffRetail)}, rebuild ${byteHex(
              comparison.firstDiffRebuild,
            )})`,
        );
      }
      console.log(`retail overlap sha256: ${comparison.retailSha256}`);
      console.log(`rebuild overlap sha256: ${comparison.rebuildSha256}`);
    }
  }

  console.log(
    "caveat: this is confirmation evidence only. The retail image still has no symbols, " +
      "so MAP-derived DGROUP offsets are not proven retail-authoritative by this utility alone.",
  );
}

try {
  await main();
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
}
