export type SourceAnchor = {
  name: string;
  file: string;
  line: number;
  note: string;
};

export const sourceAnchors: SourceAnchor[] = [
  {
    name: "CalcTics",
    file: "source/WOLFSRC/WL_DRAW.C",
    line: 1236,
    note: "adaptive tic timing with MAXTICS clamp"
  },
  {
    name: "PollControls",
    file: "source/WOLFSRC/WL_PLAY.C",
    line: 455,
    note: "controlx/controly are rebuilt once per frame"
  },
  {
    name: "ControlMovement",
    file: "source/WOLFSRC/WL_AGENT.C",
    line: 149,
    note: "turning, strafing, and forward thrust"
  },
  {
    name: "Thrust",
    file: "source/WOLFSRC/WL_AGENT.C",
    line: 928,
    note: "fixed-point movement through sin/cos tables"
  },
  {
    name: "ThreeDRefresh",
    file: "source/WOLFSRC/WL_DRAW.C",
    line: 1336,
    note: "clear, wall refresh, scaled sprite pass"
  }
];
