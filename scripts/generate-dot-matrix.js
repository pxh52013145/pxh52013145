const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUOTES_PATH = path.join(__dirname, "quotes.json");
const OUTPUT_PATH = path.join(ROOT, "assets", "dot-matrix.svg");

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

function renderCard() {
  const quotes = JSON.parse(fs.readFileSync(QUOTES_PATH, "utf8"));
  const { year, month, day, weekday } = getShanghaiDateParts();
  const dateLine = `${year} / ${month} / ${day}`;
  const quote = quotes[quoteIndexForDate(year, month, day, quotes.length)];

  const small = { cell: 4, radius: 1.35, charGap: 4, fill: "#8fa7bf", opacity: 0.85 };
  const dateStyle = { cell: 7, radius: 2.25, charGap: 7, fill: "#edf6ff", opacity: 0.96 };
  const quoteStyle = { cell: 4.5, radius: 1.45, charGap: 4.5, fill: "#d8f2ff", opacity: 0.92 };
  const quoteLines = wrapDotText(quote, 680, quoteStyle, 2);

  const quoteSvg = quoteLines
    .map((line, index) => centeredText(line, 162 + index * 32, quoteStyle))
    .join("\n");

  return `<svg width="800" height="240" viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
<title id="title">Daily dot matrix quote</title>
<desc id="desc">${escapeXml(`${dateLine} ${weekday}. ${quote}`)}</desc>
<rect width="800" height="240" rx="14" fill="#0D1117"/>
<rect x="1" y="1" width="798" height="238" rx="13" fill="url(#scan)" opacity="0.3"/>
<path d="M58 36H36V58M742 36H764V58M58 204H36V182M742 204H764V182" stroke="#6f8294" stroke-width="2" stroke-linecap="square" opacity="0.75"/>
<path d="M96 133H704" stroke="#244055" stroke-width="1" stroke-dasharray="4 12" opacity="0.55"/>
${centeredText("PXH DAILY SIGNAL", 34, small)}
${centeredText(dateLine, 72, dateStyle)}
${centeredText(weekday, 126, small)}
${quoteSvg}
<defs>
  <pattern id="scan" width="8" height="8" patternUnits="userSpaceOnUse">
    <path d="M0 7.5H8" stroke="#183043" stroke-width="1"/>
  </pattern>
</defs>
</svg>`;
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${renderCard()}\n`, "utf8");
console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
