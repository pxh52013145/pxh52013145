const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUOTES_PATH = path.join(__dirname, "quotes.json");
const QUOTE_HISTORY_PATH = path.join(__dirname, "quote-history.json");
const QUOTE_API_URL = process.env.QUOTE_API_URL || "https://zenquotes.io/api/quotes/";
const QUOTE_API_ATTEMPTS = Number.parseInt(process.env.QUOTE_API_ATTEMPTS || "3", 10);
const QUOTE_MAX_LENGTH = Number.parseInt(process.env.QUOTE_MAX_LENGTH || "86", 10);
const CLOCK_OUTPUT_PATH = path.join(ROOT, "assets", "dot-matrix.svg");
const CACHE_OUTPUT_PATH = path.join(ROOT, "assets", "signal-cache.svg");
const README_PATH = path.join(ROOT, "README.md");
const DOT_MATRIX_START = "<!-- DOT_MATRIX:START -->";
const DOT_MATRIX_END = "<!-- DOT_MATRIX:END -->";
const README_START = "<!-- SIGNAL_CACHE:START -->";
const README_END = "<!-- SIGNAL_CACHE:END -->";

const MORSE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---",
  K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-",
  U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....",
  6: "-....", 7: "--...", 8: "---..", 9: "----."
};

const SIGNALS = [
  "CACHE",
  "SIGNAL",
  "TRACE",
  "RUNE",
  "LIGHT",
  "FOCUS",
  "CODE",
  "VAULT",
  "SHARD",
  "HEART"
];

const MODES = [
  {
    label: "MORSE",
    hint: "DOTS DASHES SLASH WORDS",
    encode: (text) => text.split(" ").map((word) => word.split("").map((char) => MORSE[char] || "").join(" ")).join(" / ")
  },
  {
    label: "HEX",
    hint: "ASCII BYTES",
    encode: (text) => text.split("").map((char) => char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")).join(" ")
  },
  {
    label: "ROT13",
    hint: "HALF TURN",
    encode: (text) => text.replace(/[A-Z]/g, (char) => String.fromCharCode(65 + ((char.charCodeAt(0) - 65 + 13) % 26)))
  },
  {
    label: "ATBASH",
    hint: "MIRROR MAP",
    encode: (text) => text.replace(/[A-Z]/g, (char) => String.fromCharCode(90 - (char.charCodeAt(0) - 65)))
  }
];

const RARITIES = [
  { label: "COMMON", color: "#8b949e", weight: 68 },
  { label: "RARE", color: "#58a6ff", weight: 22 },
  { label: "EPIC", color: "#a371f7", weight: 8 },
  { label: "LEGENDARY", color: "#f2cc60", weight: 2 }
];

const TREASURES = {
  COMMON: [
    { name: "Pixel Heart", icon: "HEART" },
    { name: "Green Apple", icon: "APPLE" },
    { name: "Static Cherry", icon: "CHERRY" }
  ],
  RARE: [
    { name: "Blue Diamond", icon: "DIAMOND" },
    { name: "Signal Lemon", icon: "LEMON" },
    { name: "Rune Berry", icon: "BERRY" }
  ],
  EPIC: [
    { name: "Prism Grape", icon: "GRAPE" },
    { name: "Archive Star", icon: "STAR" },
    { name: "Cipher Crown", icon: "CROWN" }
  ],
  LEGENDARY: [
    { name: "Sun Heart", icon: "HEART" },
    { name: "Aurum Diamond", icon: "DIAMOND" },
    { name: "Oracle Crown", icon: "CROWN" }
  ]
};

const ICONS = {
  HEART: [
    "000RRR000RRR000",
    "00RRRRR0RRRRR00",
    "0RRRRRRRRRRRRR0",
    "0RRRRRRRRRRRRR0",
    "0RRRRRRRRRRRRR0",
    "00RRRRRRRRRRR00",
    "000RRRRRRRRR000",
    "0000RRRRRRR0000",
    "00000RRRRR00000",
    "000000RRR000000",
    "0000000R0000000"
  ],
  DIAMOND: [
    "000000B0000000",
    "00000BBB00000",
    "0000BBBBB0000",
    "000BBBBBBB000",
    "00BBBBBBBBB00",
    "0BBBBBBBBBBB0",
    "BBBBBBBBBBBBB",
    "0BBBBBBBBBBB0",
    "00BBBBBBBBB00",
    "000BBBBBBB000",
    "0000BBBBB0000",
    "00000BBB00000",
    "000000B0000000"
  ],
  APPLE: [
    "000000G000000",
    "00000GG000000",
    "000000G000000",
    "000RRRRRRR000",
    "00RRRRRRRRR00",
    "0RRRRRRRRRRR0",
    "0RRRRRRRRRRR0",
    "0RRRRRRRRRRR0",
    "00RRRRRRRRR00",
    "000RRRRRRR000",
    "0000RRRRR0000"
  ],
  CHERRY: [
    "00000G000G000",
    "0000G000G0000",
    "000G000G00000",
    "00G000G000000",
    "0000000000000",
    "00RRR000RRR00",
    "0RRRRR0RRRRR0",
    "0RRRRR0RRRRR0",
    "00RRR000RRR00"
  ],
  LEMON: [
    "0000YYYYY0000",
    "00YYYYYYYYY00",
    "0YYYYYYYYYYY0",
    "YYYYYYYYYYYYY",
    "YYYYYYYYYYYYY",
    "0YYYYYYYYYYY0",
    "00YYYYYYYYY00",
    "0000YYYYY0000"
  ],
  BERRY: [
    "0000G000G0000",
    "000GGG0GGG000",
    "0000P000P0000",
    "00PPPPPPPPP00",
    "0PPPPPPPPPPP0",
    "0PPPPPPPPPPP0",
    "00PPPPPPPPP00",
    "000PPPPPPP000",
    "00000PPP00000"
  ],
  GRAPE: [
    "0000G00000000",
    "000GGG0000000",
    "0000P0P0P0000",
    "000P0P0P0P000",
    "0000P0P0P0000",
    "00000P0P00000",
    "000000P000000"
  ],
  STAR: [
    "000000Y000000",
    "000000Y000000",
    "00000YYY00000",
    "YY00YYYYY00YY",
    "0YYYYYYYYYYY0",
    "000YYYYYYY000",
    "0000YYYYY0000",
    "000YYYYYYY000",
    "00YYY000YYY00",
    "0YY0000000YY0"
  ],
  CROWN: [
    "Y0000Y0000Y",
    "YY000Y000YY",
    "YYY0YYY0YYY",
    "YYYYYYYYYYY",
    "0YYYYYYYYY0",
    "0YYYYYYYYY0",
    "YYYYYYYYYYY"
  ]
};

const ICON_COLORS = {
  R: "#ff7b72",
  B: "#58a6ff",
  G: "#3fb950",
  Y: "#f2cc60",
  P: "#a371f7"
};

const FONT = {
  " ": ["000", "000", "000", "000", "000", "000", "000"],
  "!": ["1", "1", "1", "1", "1", "0", "1"],
  "\"": ["101", "101", "101", "000", "000", "000", "000"],
  "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "'": ["1", "1", "1", "0", "0", "0", "0"],
  "(": ["001", "010", "100", "100", "100", "010", "001"],
  ")": ["100", "010", "001", "001", "001", "010", "100"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  ",": ["00", "00", "00", "00", "00", "10", "10"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["0", "0", "0", "0", "0", "0", "1"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  ":": ["0", "1", "1", "0", "1", "1", "0"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "11100"],
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  "J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"]
};

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function glyphFor(char) {
  return FONT[char] || FONT["?"];
}

function measure(text, cell, charGap) {
  let width = 0;
  for (const char of text) {
    const glyph = glyphFor(char);
    width += glyph[0].length * cell + charGap;
  }
  return Math.max(0, width - charGap);
}

function drawText(text, x, y, options) {
  const { cell, radius, charGap, fill, opacity = 1 } = options;
  let cursor = x;
  const circles = [];

  for (const char of text.toUpperCase()) {
    const glyph = glyphFor(char);
    glyph.forEach((row, rowIndex) => {
      for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
        if (row[colIndex] === "1") {
          const cx = (cursor + colIndex * cell + radius).toFixed(2);
          const cy = (y + rowIndex * cell + radius).toFixed(2);
          circles.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" opacity="${opacity}"/>`);
        }
      }
    });
    cursor += glyph[0].length * cell + charGap;
  }

  return circles.join("\n");
}

function centeredText(text, y, options, width = 800) {
  const textWidth = measure(text.toUpperCase(), options.cell, options.charGap);
  return drawText(text, (width - textWidth) / 2, y, options);
}

function rightText(text, right, y, options) {
  const textWidth = measure(text.toUpperCase(), options.cell, options.charGap);
  return drawText(text, right - textWidth, y, options);
}

function wrapDotText(text, maxWidth, options, maxLines = 2) {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (measure(next, options.cell, options.charGap) <= maxWidth) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word);
      current = "";
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines;
}

function wrapPlainText(text, maxLength, maxLines = 2) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const token of tokens) {
    const next = current ? `${current} ${token}` : token;
    if (next.length <= maxLength) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
      current = token;
    } else {
      lines.push(token);
      current = "";
    }

    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines;
}

function getShanghaiDateParts() {
  const sourceDate = process.env.FORCE_DATE ? new Date(`${process.env.FORCE_DATE}T12:00:00+08:00`) : new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long"
  });

  const parts = Object.fromEntries(formatter.formatToParts(sourceDate).map((part) => [part.type, part.value]));
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    weekday: parts.weekday.toUpperCase()
  };
}

function quoteIndexForDate(year, month, day, quoteCount) {
  const utcDay = Math.floor(Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86400000);
  return utcDay % quoteCount;
}

function normalizeQuoteText(value) {
  return String(value || "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function quoteKey(value) {
  return normalizeQuoteText(value)
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Could not read ${path.relative(ROOT, filePath)}: ${error.message}`);
    }
    return fallback;
  }
}

function readQuoteHistory() {
  const history = readJsonFile(QUOTE_HISTORY_PATH, { used: [] });
  const used = Array.isArray(history.used) ? history.used : [];
  return {
    used: used
      .map((entry) => ({
        date: String(entry.date || ""),
        author: String(entry.author || "Unknown"),
        key: String(entry.key || ""),
        quote: String(entry.quote || ""),
        source: String(entry.source || "unknown")
      }))
      .filter((entry) => entry.key)
  };
}

function saveQuoteHistory(history) {
  const compactHistory = {
    used: history.used.slice(-1000)
  };
  fs.writeFileSync(QUOTE_HISTORY_PATH, `${JSON.stringify(compactHistory, null, 2)}\n`, "utf8");
}

function localQuoteForDate(year, month, day, usedKeys = new Set()) {
  const quotes = readJsonFile(QUOTES_PATH, []);
  if (!Array.isArray(quotes) || quotes.length === 0) {
    return {
      author: "Local",
      source: "local fallback",
      text: "BUILD QUIETLY. SHIP HONESTLY."
    };
  }

  const startIndex = quoteIndexForDate(year, month, day, quotes.length);
  for (let offset = 0; offset < quotes.length; offset += 1) {
    const text = normalizeQuoteText(quotes[(startIndex + offset) % quotes.length]);
    if (text && !usedKeys.has(quoteKey(text))) {
      return {
        author: "Local",
        source: "local fallback",
        text
      };
    }
  }

  return {
    author: "Local",
    source: "local fallback",
    text: normalizeQuoteText(quotes[startIndex])
  };
}

function parseQuoteCandidates(payload) {
  const values = Array.isArray(payload) ? payload : [payload];
  return values
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const text = item.q || item.quote || item.content || item.text;
      const author = item.a || item.author || item.authorName || "Unknown";
      return {
        author: String(author),
        source: "ZenQuotes",
        text: normalizeQuoteText(text)
      };
    })
    .filter((quote) => quote && quote.text && quote.text.length <= QUOTE_MAX_LENGTH);
}

async function fetchQuoteCandidates() {
  const response = await fetch(QUOTE_API_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "pxh52013145-profile-readme-action"
    }
  });

  if (!response.ok) {
    throw new Error(`Quote API returned ${response.status}`);
  }

  return parseQuoteCandidates(await response.json());
}

function chooseUnusedQuote(candidates, usedKeys) {
  return candidates.find((candidate) => !usedKeys.has(quoteKey(candidate.text)));
}

async function quoteForDate(year, month, day, dateKey) {
  const history = readQuoteHistory();
  const existing = history.used.find((entry) => entry.date === dateKey && entry.quote);
  if (existing) {
    return {
      author: existing.author,
      source: existing.source,
      text: existing.quote
    };
  }

  const usedKeys = new Set(history.used.map((entry) => entry.key));

  for (let attempt = 1; attempt <= QUOTE_API_ATTEMPTS; attempt += 1) {
    try {
      const quote = chooseUnusedQuote(await fetchQuoteCandidates(), usedKeys);
      if (quote) {
        const key = quoteKey(quote.text);
        history.used.push({
          date: dateKey,
          author: quote.author,
          key,
          quote: quote.text,
          source: quote.source
        });
        saveQuoteHistory(history);
        return quote;
      }
    } catch (error) {
      console.warn(`Quote API attempt ${attempt} failed: ${error.message}`);
    }
  }

  const fallback = localQuoteForDate(year, month, day, usedKeys);
  const key = quoteKey(fallback.text);
  if (!usedKeys.has(key)) {
    history.used.push({
      date: dateKey,
      author: fallback.author,
      key,
      quote: fallback.text,
      source: fallback.source
    });
    saveQuoteHistory(history);
  }
  return fallback;
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed) {
  let value = seed >>> 0;
  return function rng() {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, values) {
  return values[Math.floor(rng() * values.length)];
}

function weightedPick(rng, values) {
  const total = values.reduce((sum, item) => sum + item.weight, 0);
  let cursor = rng() * total;
  for (const item of values) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return values[values.length - 1];
}

async function buildSignal() {
  const { year, month, day, weekday } = getShanghaiDateParts();
  const dateLine = `${year} / ${month} / ${day}`;
  const dateKey = `${year}${month}${day}`;
  const rng = makeRng(hashString(dateKey));
  const quote = await quoteForDate(year, month, day, dateKey);
  const answer = pick(rng, SIGNALS);
  const mode = pick(rng, MODES);
  const rarity = weightedPick(rng, RARITIES);
  const treasure = pick(rng, TREASURES[rarity.label]);
  const cacheId = hashString(`${dateKey}-${answer}-${mode.label}`).toString(16).toUpperCase().padStart(8, "0").slice(0, 6);

  return {
    answer,
    cacheId,
    dateKey,
    dateLine,
    encoded: mode.encode(answer),
    hint: mode.hint,
    mode,
    quote: quote.text,
    quoteAuthor: quote.author,
    quoteSource: quote.source,
    rarity,
    treasure,
    weekday
  };
}

function renderClockCard(signal) {
  const small = { cell: 4, radius: 1.35, charGap: 4, fill: "#8fa7bf", opacity: 0.85 };
  const dateStyle = { cell: 7, radius: 2.25, charGap: 7, fill: "#edf6ff", opacity: 0.96 };
  const quoteStyle = { cell: 4.5, radius: 1.45, charGap: 4.5, fill: "#d8f2ff", opacity: 0.92 };
  const quoteLines = wrapDotText(signal.quote, 680, quoteStyle, 2);
  const quoteSvg = quoteLines
    .map((line, index) => centeredText(line, 162 + index * 32, quoteStyle))
    .join("\n");

  return `<svg width="800" height="240" viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
<title id="title">Daily dot matrix quote</title>
<desc id="desc">${escapeXml(`${signal.dateLine} ${signal.weekday}. ${signal.quote}`)}</desc>
<rect width="800" height="240" rx="14" fill="#0D1117"/>
<rect x="1" y="1" width="798" height="238" rx="13" fill="url(#scan)" opacity="0.3"/>
<path d="M58 36H36V58M742 36H764V58M58 204H36V182M742 204H764V182" stroke="#6f8294" stroke-width="2" stroke-linecap="square" opacity="0.75"/>
<path d="M96 133H704" stroke="#244055" stroke-width="1" stroke-dasharray="4 12" opacity="0.55"/>
${centeredText("PXH DAILY SIGNAL", 34, small)}
${centeredText(signal.dateLine, 72, dateStyle)}
${centeredText(signal.weekday, 126, small)}
${quoteSvg}
<defs>
  <pattern id="scan" width="8" height="8" patternUnits="userSpaceOnUse">
    <path d="M0 7.5H8" stroke="#183043" stroke-width="1"/>
  </pattern>
</defs>
</svg>`;
}

function drawIcon(patternName, x, y, cell, rarityColor) {
  const rows = ICONS[patternName] || ICONS.HEART;
  const dotRadius = cell * 0.34;
  const iconWidth = Math.max(...rows.map((row) => row.length)) * cell;
  const iconHeight = rows.length * cell;
  const dots = [];

  rows.forEach((row, rowIndex) => {
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const token = row[colIndex];
      if (token === "0") continue;
      const color = ICON_COLORS[token] || rarityColor;
      const cx = (x + colIndex * cell + cell / 2).toFixed(2);
      const cy = (y + rowIndex * cell + cell / 2).toFixed(2);
      dots.push(`<circle cx="${cx}" cy="${cy}" r="${dotRadius.toFixed(2)}" fill="${color}"/>`);
    }
  });

  return {
    height: iconHeight,
    svg: dots.join("\n"),
    width: iconWidth
  };
}

function renderSignalCacheCard(signal) {
  const small = { cell: 3.8, radius: 1.25, charGap: 3.8, fill: "#8fa7bf", opacity: 0.84 };
  const labelStyle = { cell: 4.2, radius: 1.35, charGap: 4.2, fill: signal.rarity.color, opacity: 0.95 };
  const icon = drawIcon(signal.treasure.icon, 72, 96, 10, signal.rarity.color);
  const iconX = 72 + (150 - icon.width) / 2;
  const iconY = 96 + (132 - icon.height) / 2;
  const centeredIcon = drawIcon(signal.treasure.icon, iconX, iconY, 10, signal.rarity.color);
  const encodedLines = wrapPlainText(signal.encoded, 34, 2);
  const encodedSvg = encodedLines
    .map((line, index) => `<text x="292" y="${192 + index * 28}" fill="#edf6ff" font-family="Cascadia Code, SFMono-Regular, Consolas, monospace" font-size="18" letter-spacing="1.5">${escapeXml(line)}</text>`)
    .join("\n");

  return `<svg width="800" height="280" viewBox="0 0 800 280" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
<title id="title">Signal Cache terminal easter egg</title>
<desc id="desc">${escapeXml(`${signal.mode.label} puzzle. ${signal.rarity.label} drop ${signal.treasure.name}.`)}</desc>
<rect width="800" height="280" rx="8" fill="#0D1117"/>
<rect x="1" y="1" width="798" height="278" rx="7" stroke="#243246"/>
<rect width="800" height="280" rx="8" fill="url(#dotgrid)" opacity="0.55"/>
<path d="M50 38H32V56M750 38H768V56M50 242H32V224M750 242H768V224" stroke="${signal.rarity.color}" stroke-width="1.5" stroke-linecap="square" opacity="0.74"/>
${drawText("TERMINAL CACHE", 52, 34, small)}
${rightText(`RUN ${signal.dateKey}`, 748, 34, small)}
<rect x="58" y="84" width="178" height="156" rx="4" stroke="${signal.rarity.color}" opacity="0.52"/>
${centeredIcon.svg}
${drawText("DROP", 292, 82, labelStyle)}
<text x="292" y="118" fill="${signal.rarity.color}" font-family="Cascadia Code, SFMono-Regular, Consolas, monospace" font-size="22" font-weight="700">${escapeXml(signal.treasure.name)}</text>
<text x="292" y="142" fill="#8fa7bf" font-family="Cascadia Code, SFMono-Regular, Consolas, monospace" font-size="14" letter-spacing="0.8">${escapeXml(`${signal.rarity.label} / ${signal.cacheId}`)}</text>
${drawText("PAYLOAD", 292, 162, small)}
${encodedSvg}
<text x="292" y="232" fill="#8fa7bf" font-family="Cascadia Code, SFMono-Regular, Consolas, monospace" font-size="14" letter-spacing="0.8">${escapeXml(`${signal.mode.label} / ${signal.hint}`)}</text>
<defs>
  <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
    <circle cx="4" cy="4" r="0.85" fill="#58A6FF" opacity="0.22"/>
  </pattern>
</defs>
</svg>`;
}

function renderReadmeBlock(signal) {
  return `${DOT_MATRIX_START}
<p align="center">
    <img width="800" src="./assets/dot-matrix.svg" alt="Daily dot matrix quote" title="Daily dot matrix quote"/>
    <br/>
    <sub>Quote powered by <a href="https://zenquotes.io/">ZenQuotes API</a>.</sub>
</p>
${DOT_MATRIX_END}

${README_START}
<p align="center">
    <img width="800" src="./assets/signal-cache.svg" alt="Signal Cache terminal easter egg" title="Signal Cache terminal easter egg"/>
</p>

<details>
<summary>Signal Cache decode key</summary>

\`\`\`text
RUN: ${signal.dateKey}
QUOTE_SOURCE: ${signal.quoteSource}
QUOTE_AUTHOR: ${signal.quoteAuthor}
MODE: ${signal.mode.label}
HINT: ${signal.hint}
ANSWER: ${signal.answer}
DROP: ${signal.treasure.name} / ${signal.rarity.label}
ICON: ${signal.treasure.icon}
UPDATED: ${signal.dateLine} ${signal.weekday} Asia/Shanghai
\`\`\`

</details>
${README_END}`;
}

function updateReadme(signal) {
  if (!fs.existsSync(README_PATH)) return;

  const readme = fs.readFileSync(README_PATH, "utf8");
  const block = renderReadmeBlock(signal);
  if (readme.includes(DOT_MATRIX_START) && readme.includes(README_END)) {
    const next = readme.replace(new RegExp(`${DOT_MATRIX_START}[\\s\\S]*?${README_END}`), block);
    fs.writeFileSync(README_PATH, next, "utf8");
    return;
  }

  if (readme.includes(README_START) && readme.includes(README_END)) {
    const next = readme.replace(new RegExp(`${README_START}[\\s\\S]*?${README_END}`), block);
    fs.writeFileSync(README_PATH, next, "utf8");
    return;
  }

  const imageBlock = /<p align="center">\r?\n\s*<img width="800" src="\.\/assets\/dot-matrix\.svg"[\s\S]*?\r?\n<\/p>/;
  if (imageBlock.test(readme)) {
    fs.writeFileSync(README_PATH, readme.replace(imageBlock, block), "utf8");
  }
}

async function main() {
  const signal = await buildSignal();
  fs.mkdirSync(path.dirname(CLOCK_OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(CLOCK_OUTPUT_PATH, `${renderClockCard(signal)}\n`, "utf8");
  fs.writeFileSync(CACHE_OUTPUT_PATH, `${renderSignalCacheCard(signal)}\n`, "utf8");
  updateReadme(signal);
  console.log(`Generated ${path.relative(ROOT, CLOCK_OUTPUT_PATH)} and ${path.relative(ROOT, CACHE_OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
