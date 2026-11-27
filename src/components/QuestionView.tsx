"use client";
import { useEffect, useRef, useState } from "react";
import type { QuestionDto } from "@/lib/api-client";
import { sortedEntries } from "@/lib/order";

type Props = {
  q: QuestionDto;
  answers: Record<string, string>;
  onChange: (key: string, value: string, immediate: boolean) => void;
};

const LETTERS = ["A", "B", "C", "D"];

function ChoiceList({ options, value, onPick }: { options: Record<string, string>; value?: string; onPick: (v: string) => void }) {
  return (
    <div className="options" role="radiogroup">
      {Object.entries(options).map(([k, text]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} className={`option${value === k ? " selected" : ""}`} onClick={() => onPick(value === k ? "" : k)}>
          <span className="letter">{k}</span>
          <span>{text}</span>
        </button>
      ))}
    </div>
  );
}

function Stem({ text }: { text: string }) {
  return (
    <div className="stem">
      {text.split("\n").map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
}

function Items({ items }: { items: Array<string | { text: string }> | null }) {
  if (!items?.length) return null;
  return (
    <ol className="items">
      {items.map((it, i) => (
        <li key={i}>{typeof it === "string" ? it : it.text}</li>
      ))}
    </ol>
  );
}

function PairTable({ left, right }: { left: Record<string, string>; right: Record<string, string> }) {
  return (
    <div className="pairs">
      <dl>
        {sortedEntries(left).map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      <dl>
        {sortedEntries(right).map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}

function DataTable({ table }: { table: { headers: string[]; rows: string[][] } }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{table.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function OpenInput({ k, part, value, onChange }: { k: string; part: any; value: string; onChange: Props["onChange"] }) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setText(value), [value]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <div className="open-part">
      <label htmlFor={`in-${k}`}><b>{part.label})</b> {part.prompt} <span className="pts">[{part.points}]</span></label>
      <input
        id={`in-${k}`}
        type="text"
        inputMode={part.kind === "text" ? "text" : "numeric"}
        autoComplete="off"
        maxLength={200}
        value={text}
        placeholder="Javobingiz"
        onChange={(e) => {
          setText(e.target.value);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onChange(k, e.target.value, false), 600);
        }}
        onBlur={() => { if (timer.current) clearTimeout(timer.current); onChange(k, text, true); }}
      />
    </div>
  );
}

export function QuestionView({ q, answers, onChange }: Props) {
  const p = q.payload;

  if (q.type === "open") {
    return (
      <article className="question">
        <h2>{q.label}-topshiriq</h2>
        <Stem text={p.stem} />
        {p.parts.map((part: any) => {
          const k = `${q.label}${part.label}`;
          return <OpenInput key={k} k={k} part={part} value={answers[k] ?? ""} onChange={onChange} />;
        })}
      </article>
    );
  }

  if (q.type === "block_matching") {
    const opts = Object.fromEntries(Object.entries(p.shared_options).map(([k, v]: any) => [k, v.text]));
    return (
      <article className="question">
        <h2>{q.label}-topshiriqlar</h2>
        <Stem text={p.stem} />
        <dl className="shared">{Object.entries(opts).map(([k, t]) => <div key={k}><dt>{k}</dt><dd>{t as string}</dd></div>)}</dl>
        {p.questions.map((s: any) => (
          <div key={s.no} className="sub">
            <h3>{s.no}. {s.stem} <span className="pts">[{s.points}]</span></h3>
            <div className="letters-row">
              {Object.keys(opts).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={answers[String(s.no)] === k} className={`chip${answers[String(s.no)] === k ? " selected" : ""}`} onClick={() => onChange(String(s.no), answers[String(s.no)] === k ? "" : k, true)}>{k}</button>
              ))}
            </div>
          </div>
        ))}
      </article>
    );
  }

  // yopiq turlar
  const options = Object.fromEntries(LETTERS.map((k) => [k, p.options[k]]));
  return (
    <article className="question">
      <h2>{q.label}-topshiriq <span className="pts">[{p.points}]</span></h2>
      <Stem text={p.stem} />
      {p.image && <img className="figure" src={p.image} alt="Topshiriq rasmi" />}
      {p.table && <DataTable table={p.table} />}
      {p.left && p.right && <PairTable left={p.left} right={p.right} />}
      <Items items={p.items} />
      {p.facts?.length ? <ol className="items facts" type="1">{p.facts.map((f: string, i: number) => <li key={i}>{f}</li>)}</ol> : null}
      <ChoiceList options={options} value={answers[q.label]} onPick={(v) => onChange(q.label, v, true)} />
    </article>
  );
}
