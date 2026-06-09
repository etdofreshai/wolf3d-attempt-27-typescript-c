export type SourceAnchor = {
  label: string;
  file: string;
  lines: string;
  detail: string;
};

export const SOURCE_ANCHORS: SourceAnchor[] = [
  {
    label: "maptype",
    file: "source/WOLFSRC/ID_CA.H",
    lines: "9-17",
    detail: "Plane offsets, packed lengths, dimensions, and DOS map name."
  },
  {
    label: "mapfiletype",
    file: "source/WOLFSRC/ID_CA.C",
    lines: "33-38",
    detail: "RLEW tag and MAPHEAD offset table."
  },
  {
    label: "CAL_CarmackExpand",
    file: "source/WOLFSRC/ID_CA.C",
    lines: "609-659",
    detail: "Near and far tagged word-stream expansion."
  },
  {
    label: "CA_RLEWexpand",
    file: "source/WOLFSRC/ID_CA.C",
    lines: "734-769",
    detail: "RLEW word expansion after Carmack decode."
  },
  {
    label: "CA_CacheMap",
    file: "source/WOLFSRC/ID_CA.C",
    lines: "1428-1485",
    detail: "Read, Carmack-expand, skip RLEW length word, then expand map planes."
  },
  {
    label: "ScanInfoPlane",
    file: "source/WOLFSRC/WL_GAME.C",
    lines: "221-241",
    detail: "Player start tiles 19 through 22 on plane 1."
  }
];
