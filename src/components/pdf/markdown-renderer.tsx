import { Fragment } from "react";
import { Text, View, type Styles } from "@react-pdf/renderer";
import { styles, colors } from "./styles";

type StyleProp = Styles[string] | Styles[string][];

/**
 * Espaciado entre bloques. Aumentado vs v1 para mejor legibilidad.
 * Markdown source de las plantillas legales puede ser denso, aquí compensamos.
 */
const SPACER_HEIGHT = 6;

/**
 * Mini-parser de Markdown para react-pdf.
 *
 * Soporta:
 *   - # / ## / ### como headings
 *   - **negrita** inline
 *   - listas con `- ` (no anidadas)
 *   - listas numeradas con `1.` `2.` (no anidadas)
 *   - `---` como separador horizontal
 *   - líneas vacías como spacing
 *   - el resto: párrafos
 *
 * No soporta links/imágenes/code blocks porque las plantillas legales no los
 * usan. Si en el futuro hace falta, ampliar aquí.
 */

interface InlineSegment {
  text: string;
  bold?: boolean;
}

function parseInline(line: string): InlineSegment[] {
  // Split por **...** preservando los marcadores
  const out: InlineSegment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > lastIdx) out.push({ text: line.slice(lastIdx, m.index) });
    out.push({ text: m[1], bold: true });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < line.length) out.push({ text: line.slice(lastIdx) });
  return out.length > 0 ? out : [{ text: line }];
}

function InlineText({ segments, baseStyle }: { segments: InlineSegment[]; baseStyle?: StyleProp }) {
  return (
    <Text style={baseStyle}>
      {segments.map((s, i) => (
        <Text key={i} style={s.bold ? { fontFamily: "Helvetica-Bold" } : undefined}>
          {s.text}
        </Text>
      ))}
    </Text>
  );
}

export function MarkdownRenderer({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: React.ReactNode[] = [];

  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Línea vacía → spacer
    if (trimmed.trim().length === 0) {
      blocks.push(<View key={key++} style={{ height: SPACER_HEIGHT }} />);
      i++;
      continue;
    }

    // Separador
    if (/^---+$/.test(trimmed.trim())) {
      blocks.push(<View key={key++} style={styles.ruleSoft} />);
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      blocks.push(
        <InlineText key={key++} segments={parseInline(trimmed.slice(4))} baseStyle={styles.h3} />,
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push(
        <InlineText key={key++} segments={parseInline(trimmed.slice(3))} baseStyle={styles.h2} />,
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push(
        <InlineText key={key++} segments={parseInline(trimmed.slice(2))} baseStyle={styles.h1} />,
      );
      i++;
      continue;
    }

    // Lista con bullet "- "
    if (/^- /.test(trimmed)) {
      const items: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length && /^- /.test(lines[j].trimEnd())) {
        items.push(
          <View key={`li-${j}`} style={styles.listItem}>
            <Text style={styles.listBullet}>·</Text>
            <InlineText segments={parseInline(lines[j].trimEnd().slice(2))} baseStyle={styles.listText} />
          </View>,
        );
        j++;
      }
      blocks.push(
        <View key={key++} style={styles.list}>
          {items}
        </View>,
      );
      i = j;
      continue;
    }

    // Lista numerada "1. ", "2. ", ...
    const numMatch = /^(\d+)\. /.exec(trimmed);
    if (numMatch) {
      const items: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length) {
        const m = /^(\d+)\. /.exec(lines[j].trimEnd());
        if (!m) break;
        items.push(
          <View key={`oli-${j}`} style={styles.listItem}>
            <Text style={styles.listBullet}>{m[1]}.</Text>
            <InlineText
              segments={parseInline(lines[j].trimEnd().slice(m[0].length))}
              baseStyle={styles.listText}
            />
          </View>,
        );
        j++;
      }
      blocks.push(
        <View key={key++} style={styles.list}>
          {items}
        </View>,
      );
      i = j;
      continue;
    }

    // Párrafo: agrupa líneas hasta línea vacía / heading / lista / separador
    const para: string[] = [trimmed];
    let j = i + 1;
    while (j < lines.length) {
      const t = lines[j].trimEnd();
      if (t.trim().length === 0) break;
      if (t.startsWith("# ") || t.startsWith("## ") || t.startsWith("### ")) break;
      if (/^- /.test(t)) break;
      if (/^\d+\. /.test(t)) break;
      if (/^---+$/.test(t.trim())) break;
      para.push(t);
      j++;
    }
    blocks.push(
      <InlineText
        key={key++}
        segments={parseInline(para.join(" "))}
        baseStyle={styles.p}
      />,
    );
    i = j;
  }

  return <Fragment>{blocks}</Fragment>;
}

export { colors };
