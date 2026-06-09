export const SCREEN_WIDTH = 320;
export const SCREEN_HEIGHT = 200;
export const STATUS_LINES = 40;
export const VIEW_HEIGHT = SCREEN_HEIGHT - STATUS_LINES;

const FRAC_BITS = 16;
const FIXED_ONE = 1 << FRAC_BITS;
const TILE_SHIFT = 16;
const TILE_GLOBAL = FIXED_ONE;
const MINDIST = 0x5800;

const ANGLES = 360;
const ANG90 = ANGLES / 4;
const ANG180 = ANGLES / 2;
const MAXTICS = 10;
const TIC_RATE = 70;
const TIC_MS = 1000 / TIC_RATE;

const BASEMOVE = 35;
const RUNMOVE = 70;
const MOVESCALE = 150;
const BACKMOVESCALE = 100;
const ANGLESCALE = 20;
const FOV_PLANE = 0.66;

type Buttons = {
  attack: boolean;
  run: boolean;
  strafe: boolean;
};

export type RuntimeInput = {
  forward: boolean;
  back: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  strafeLeft: boolean;
  strafeRight: boolean;
  run: boolean;
  attack: boolean;
  mouseTurn: number;
};

type Player = {
  x: number;
  y: number;
  angle: number;
  tilex: number;
  tiley: number;
};

type Sprite = {
  x: number;
  y: number;
  color: string;
};

export type RuntimeDiagnostics = {
  tics: number;
  angle: number;
  tile: string;
  rays: number;
};

const WORLD_MAP = [
  "111111111111111111111111",
  "100000000000000000000001",
  "101111101111111011111101",
  "100000100000001010000001",
  "101110111011101010111101",
  "101000001010001000100001",
  "101011111010111110101101",
  "100010000010000010100001",
  "111010111111111010111101",
  "100010100000001010000001",
  "101110101111101011111101",
  "100000101000101000000001",
  "101111101010101111101101",
  "101000001010100000100001",
  "101011111010111110111101",
  "101000000010000010000001",
  "101111111111101011111101",
  "100000000000101010000001",
  "101111101110101010111101",
  "100000100010001000100001",
  "101110111011111110101101",
  "100000000000000000000001",
  "100000000000000000000001",
  "111111111111111111111111"
] as const;

const WALL_PALETTES = [
  ["#423028", "#9e6f4c", "#d5ac70", "#6d4835"],
  ["#243538", "#528179", "#9cc6ae", "#36544f"],
  ["#332838", "#755173", "#c28ba0", "#533853"],
  ["#2d3234", "#6c7475", "#b6b2a1", "#474c4c"]
] as const;

const SPRITES: Sprite[] = [
  { x: 10.5, y: 4.5, color: "#bf4545" },
  { x: 17.5, y: 11.5, color: "#d7b15e" },
  { x: 7.5, y: 18.5, color: "#50a0a0" }
];

const sinTable = Array.from({ length: ANGLES }, (_, angle) =>
  Math.round(Math.sin((angle * Math.PI) / 180) * FIXED_ONE)
);
const cosTable = Array.from({ length: ANGLES }, (_, angle) =>
  Math.round(Math.cos((angle * Math.PI) / 180) * FIXED_ONE)
);

export function fixedByFrac(a: number, b: number): number {
  return Math.trunc((a * b) / FIXED_ONE);
}

function wrapAngle(angle: number): number {
  let wrapped = angle % ANGLES;
  if (wrapped < 0) {
    wrapped += ANGLES;
  }
  return wrapped;
}

function tileAt(tileX: number, tileY: number): number {
  if (tileY < 0 || tileY >= WORLD_MAP.length || tileX < 0 || tileX >= WORLD_MAP[0].length) {
    return 1;
  }

  return Number(WORLD_MAP[tileY][tileX]);
}

function toTile(globalPosition: number): number {
  return Math.trunc(globalPosition / TILE_GLOBAL);
}

export class WolfDosMachine {
  private player: Player = this.createPlayer();
  private ticRemainder = 0;
  private angleFrac = 0;
  private controlx = 0;
  private controly = 0;
  private buttons: Buttons = {
    attack: false,
    run: false,
    strafe: false
  };
  private wallHeight = new Uint16Array(SCREEN_WIDTH);
  private zBuffer = new Float64Array(SCREEN_WIDTH);
  private totalTics = 0;
  private lastTics = 0;
  private frameOn = 0;
  private attackFlash = 0;

  reset(): void {
    this.player = this.createPlayer();
    this.ticRemainder = 0;
    this.angleFrac = 0;
    this.totalTics = 0;
    this.lastTics = 0;
    this.frameOn = 0;
    this.attackFlash = 0;
  }

  update(input: RuntimeInput, elapsedMs: number): void {
    const tics = this.calcTics(elapsedMs);
    if (tics <= 0) {
      return;
    }

    this.pollControls(input, tics);
    this.controlMovement();
    if (this.buttons.attack) {
      this.attackFlash = 5;
    } else if (this.attackFlash > 0) {
      this.attackFlash = Math.max(0, this.attackFlash - tics);
    }

    this.lastTics = tics;
    this.totalTics += tics;
    this.frameOn += 1;
  }

  step(input: RuntimeInput): void {
    this.pollControls(input, 1);
    this.controlMovement();
    this.lastTics = 1;
    this.totalTics += 1;
    this.frameOn += 1;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = false;
    this.clearVga(ctx);
    this.wallRefresh(ctx);
    this.drawSprites(ctx);
    this.drawWeapon(ctx);
    this.drawStatus(ctx);
  }

  diagnostics(): RuntimeDiagnostics {
    return {
      tics: this.totalTics,
      angle: this.player.angle,
      tile: `${this.player.tilex},${this.player.tiley}`,
      rays: SCREEN_WIDTH
    };
  }

  private createPlayer(): Player {
    const x = 3.5 * TILE_GLOBAL;
    const y = 3.5 * TILE_GLOBAL;
    return {
      x,
      y,
      angle: 0,
      tilex: toTile(x),
      tiley: toTile(y)
    };
  }

  private calcTics(elapsedMs: number): number {
    this.ticRemainder += elapsedMs / TIC_MS;
    const rawTics = Math.floor(this.ticRemainder);
    if (rawTics <= 0) {
      return 0;
    }

    const tics = Math.min(rawTics, MAXTICS);
    this.ticRemainder -= rawTics;
    if (rawTics > MAXTICS) {
      this.ticRemainder = 0;
    }

    return tics;
  }

  private pollControls(input: RuntimeInput, tics: number): void {
    const move = input.run ? RUNMOVE : BASEMOVE;
    this.controlx = 0;
    this.controly = 0;
    this.buttons = {
      attack: input.attack,
      run: input.run,
      strafe: input.strafeLeft || input.strafeRight
    };

    if (input.forward) {
      this.controly -= move * tics;
    }
    if (input.back) {
      this.controly += move * tics;
    }

    if (this.buttons.strafe) {
      if (input.strafeLeft) {
        this.controlx += move * tics;
      }
      if (input.strafeRight) {
        this.controlx -= move * tics;
      }
    } else {
      if (input.turnLeft) {
        this.controlx += move * tics;
      }
      if (input.turnRight) {
        this.controlx -= move * tics;
      }
      if (input.mouseTurn !== 0) {
        this.controlx -= input.mouseTurn * 2;
      }
    }
  }

  private controlMovement(): void {
    if (this.buttons.strafe) {
      if (this.controlx > 0) {
        this.thrust(wrapAngle(this.player.angle - ANG90), this.controlx * MOVESCALE);
      } else if (this.controlx < 0) {
        this.thrust(wrapAngle(this.player.angle + ANG90), -this.controlx * MOVESCALE);
      }
    } else {
      this.angleFrac += this.controlx;
      const angleUnits = Math.trunc(this.angleFrac / ANGLESCALE);
      this.angleFrac -= angleUnits * ANGLESCALE;
      this.player.angle = wrapAngle(this.player.angle - angleUnits);
    }

    if (this.controly < 0) {
      this.thrust(this.player.angle, -this.controly * MOVESCALE);
    } else if (this.controly > 0) {
      this.thrust(wrapAngle(this.player.angle + ANG180), this.controly * BACKMOVESCALE);
    }
  }

  private thrust(angle: number, speed: number): void {
    const cappedSpeed = Math.min(speed, MINDIST * 2 - 1);
    const xmove = fixedByFrac(cappedSpeed, cosTable[angle]);
    const ymove = -fixedByFrac(cappedSpeed, sinTable[angle]);

    this.clipMove(xmove, ymove);
    this.player.tilex = toTile(this.player.x);
    this.player.tiley = toTile(this.player.y);
  }

  private clipMove(xmove: number, ymove: number): void {
    const nextX = this.player.x + xmove;
    const nextY = this.player.y + ymove;

    if (this.canOccupy(nextX, this.player.y)) {
      this.player.x = nextX;
    }
    if (this.canOccupy(this.player.x, nextY)) {
      this.player.y = nextY;
    }
  }

  private canOccupy(x: number, y: number): boolean {
    const radius = MINDIST;
    const samples = [
      [x - radius, y - radius],
      [x + radius, y - radius],
      [x - radius, y + radius],
      [x + radius, y + radius]
    ];

    return samples.every(([sampleX, sampleY]) => tileAt(toTile(sampleX), toTile(sampleY)) === 0);
  }

  private clearVga(ctx: CanvasRenderingContext2D): void {
    const horizon = Math.floor(VIEW_HEIGHT / 2);
    const ceiling = ctx.createLinearGradient(0, 0, 0, horizon);
    ceiling.addColorStop(0, "#171717");
    ceiling.addColorStop(1, "#26201e");
    ctx.fillStyle = ceiling;
    ctx.fillRect(0, 0, SCREEN_WIDTH, horizon);

    const floor = ctx.createLinearGradient(0, horizon, 0, VIEW_HEIGHT);
    floor.addColorStop(0, "#3f3a32");
    floor.addColorStop(1, "#171413");
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, SCREEN_WIDTH, VIEW_HEIGHT);
  }

  private wallRefresh(ctx: CanvasRenderingContext2D): void {
    const posX = this.player.x / TILE_GLOBAL;
    const posY = this.player.y / TILE_GLOBAL;
    const angleRadians = (this.player.angle * Math.PI) / 180;
    const dirX = Math.cos(angleRadians);
    const dirY = -Math.sin(angleRadians);
    const planeX = -dirY * FOV_PLANE;
    const planeY = dirX * FOV_PLANE;

    for (let x = 0; x < SCREEN_WIDTH; x += 1) {
      const cameraX = (2 * x) / SCREEN_WIDTH - 1;
      const rayDirX = dirX + planeX * cameraX;
      const rayDirY = dirY + planeY * cameraX;

      let mapX = Math.floor(posX);
      let mapY = Math.floor(posY);

      const deltaDistX = rayDirX === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayDirX);
      const deltaDistY = rayDirY === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayDirY);
      let stepX = 0;
      let stepY = 0;
      let sideDistX = 0;
      let sideDistY = 0;

      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (posX - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1 - posX) * deltaDistX;
      }

      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (posY - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1 - posY) * deltaDistY;
      }

      let side = 0;
      let tile = 0;
      for (let guard = 0; guard < 96; guard += 1) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }

        tile = tileAt(mapX, mapY);
        if (tile > 0) {
          break;
        }
      }

      const distance =
        side === 0
          ? (mapX - posX + (1 - stepX) / 2) / rayDirX
          : (mapY - posY + (1 - stepY) / 2) / rayDirY;
      const safeDistance = Math.max(distance, 0.05);
      const lineHeight = Math.min(240, Math.floor(VIEW_HEIGHT / safeDistance));
      const drawStart = Math.max(0, Math.floor(-lineHeight / 2 + VIEW_HEIGHT / 2));
      const drawEnd = Math.min(VIEW_HEIGHT - 1, Math.floor(lineHeight / 2 + VIEW_HEIGHT / 2));
      const textureX = side === 0 ? posY + safeDistance * rayDirY : posX + safeDistance * rayDirX;

      this.wallHeight[x] = lineHeight;
      this.zBuffer[x] = safeDistance;
      this.drawWallColumn(ctx, x, drawStart, drawEnd, tile, side, textureX);
    }
  }

  private drawWallColumn(
    ctx: CanvasRenderingContext2D,
    x: number,
    yStart: number,
    yEnd: number,
    tile: number,
    side: number,
    textureX: number
  ): void {
    const palette = WALL_PALETTES[(tile - 1) % WALL_PALETTES.length];
    const texel = Math.floor(((textureX % 1) + 1) * 64) % 64;
    const mortar = texel % 16 === 0 || texel % 16 === 15;
    const shade = side === 1 ? 1 : 0;
    const distanceShade = Math.min(2, Math.floor((this.wallHeight[x] < 42 ? 1 : 0) + shade));
    ctx.fillStyle = mortar ? palette[3] : palette[distanceShade + 1];
    ctx.fillRect(x, yStart, 1, Math.max(1, yEnd - yStart + 1));

    if (texel % 8 === 0) {
      ctx.fillStyle = palette[0];
      ctx.fillRect(x, yStart, 1, Math.max(1, Math.floor((yEnd - yStart) / 10)));
    }
  }

  private drawSprites(ctx: CanvasRenderingContext2D): void {
    const posX = this.player.x / TILE_GLOBAL;
    const posY = this.player.y / TILE_GLOBAL;
    const angleRadians = (this.player.angle * Math.PI) / 180;
    const dirX = Math.cos(angleRadians);
    const dirY = -Math.sin(angleRadians);
    const planeX = -dirY * FOV_PLANE;
    const planeY = dirX * FOV_PLANE;
    const invDet = 1 / (planeX * dirY - dirX * planeY);
    const sortedSprites = [...SPRITES].sort((a, b) => {
      const aDist = (a.x - posX) ** 2 + (a.y - posY) ** 2;
      const bDist = (b.x - posX) ** 2 + (b.y - posY) ** 2;
      return bDist - aDist;
    });

    for (const sprite of sortedSprites) {
      const spriteX = sprite.x - posX;
      const spriteY = sprite.y - posY;
      const transformX = invDet * (dirY * spriteX - dirX * spriteY);
      const transformY = invDet * (-planeY * spriteX + planeX * spriteY);
      if (transformY <= 0.05) {
        continue;
      }

      const spriteScreenX = Math.floor((SCREEN_WIDTH / 2) * (1 + transformX / transformY));
      const spriteHeight = Math.abs(Math.floor(VIEW_HEIGHT / transformY));
      const spriteWidth = spriteHeight;
      const drawStartY = Math.max(0, Math.floor(-spriteHeight / 2 + VIEW_HEIGHT / 2));
      const drawEndY = Math.min(VIEW_HEIGHT - 1, Math.floor(spriteHeight / 2 + VIEW_HEIGHT / 2));
      const drawStartX = Math.max(0, Math.floor(-spriteWidth / 2 + spriteScreenX));
      const drawEndX = Math.min(SCREEN_WIDTH - 1, Math.floor(spriteWidth / 2 + spriteScreenX));

      for (let stripe = drawStartX; stripe < drawEndX; stripe += 1) {
        if (transformY > 0 && stripe >= 0 && stripe < SCREEN_WIDTH && transformY < this.zBuffer[stripe]) {
          const center = Math.abs(stripe - spriteScreenX) / Math.max(spriteWidth / 2, 1);
          if (center < 0.95) {
            ctx.fillStyle = center < 0.55 ? sprite.color : "#191414";
            ctx.fillRect(stripe, drawStartY, 1, Math.max(1, drawEndY - drawStartY));
          }
        }
      }
    }
  }

  private drawWeapon(ctx: CanvasRenderingContext2D): void {
    const bob = Math.sin(this.frameOn / 8) * 2;
    const muzzle = this.attackFlash > 0;
    const baseY = VIEW_HEIGHT - 4 + bob;
    ctx.fillStyle = "#7b5847";
    ctx.fillRect(126, baseY - 14, 68, 14);
    ctx.fillStyle = "#1a1716";
    ctx.fillRect(150, baseY - 30, 20, 34);
    ctx.fillStyle = "#58504a";
    ctx.fillRect(155, baseY - 44, 10, 26);
    ctx.fillStyle = "#c3bab1";
    ctx.fillRect(157, baseY - 42, 6, 14);

    if (muzzle) {
      ctx.fillStyle = "#f7d36d";
      ctx.fillRect(150, baseY - 58, 20, 14);
      ctx.fillStyle = "#fff6b0";
      ctx.fillRect(156, baseY - 64, 8, 26);
    }
  }

  private drawStatus(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#1d1a18";
    ctx.fillRect(0, VIEW_HEIGHT, SCREEN_WIDTH, STATUS_LINES);
    ctx.fillStyle = "#8d7f6d";
    ctx.fillRect(0, VIEW_HEIGHT, SCREEN_WIDTH, 2);
    ctx.fillStyle = "#30261f";
    ctx.fillRect(84, VIEW_HEIGHT + 5, 48, 30);
    ctx.fillRect(188, VIEW_HEIGHT + 5, 48, 30);

    this.statusText(ctx, "SCORE", 10, VIEW_HEIGHT + 12, "#bcb4a2");
    this.statusText(ctx, String(this.totalTics).padStart(6, "0"), 10, VIEW_HEIGHT + 26, "#f0d37f");
    this.statusText(ctx, "HEALTH", 142, VIEW_HEIGHT + 12, "#bcb4a2");
    this.statusText(ctx, "100%", 148, VIEW_HEIGHT + 26, "#efefdf");
    this.statusText(ctx, "AMMO", 252, VIEW_HEIGHT + 12, "#bcb4a2");
    this.statusText(ctx, this.buttons.attack ? "7" : "8", 268, VIEW_HEIGHT + 26, "#efefdf");

    ctx.fillStyle = "#c4916d";
    ctx.fillRect(98, VIEW_HEIGHT + 12, 20, 18);
    ctx.fillStyle = "#211918";
    ctx.fillRect(102, VIEW_HEIGHT + 18, 4, 3);
    ctx.fillRect(111, VIEW_HEIGHT + 18, 4, 3);
    ctx.fillStyle = this.attackFlash > 0 ? "#5c1715" : "#6f382e";
    ctx.fillRect(106, VIEW_HEIGHT + 26, 7, 2);

    ctx.fillStyle = "#453a34";
    ctx.fillRect(202, VIEW_HEIGHT + 12, 20, 18);
    ctx.fillStyle = "#c6b6a2";
    ctx.fillRect(207, VIEW_HEIGHT + 15, 10, 10);
  }

  private statusText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color: string): void {
    ctx.font = "8px 'Courier New', monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }
}
