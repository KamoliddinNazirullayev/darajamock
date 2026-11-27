"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, unitKeys, type AttemptState, type ResultDto } from "@/lib/api-client";
import { QuestionView } from "@/components/QuestionView";

type Phase = "loading" | "intro" | "exam" | "result" | "error" | "closed";
type SaveStatus = "idle" | "saving" | "saved" | "failed";

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExamApp() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [state, setState] = useState<AttemptState | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState<ResultDto | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const deadline = useRef(0);
  const pending = useRef(new Map<string, string>()); // yuborilmagan javoblar (qayta urinish uchun)
  const submitting = useRef(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();
    setPhase("intro");
  }, []);

  const begin = useCallback(async () => {
    setBusy(true);
    try {
      const { attemptId } = await api.start();
      const s = await api.state(attemptId);
      if (s.status !== "in_progress") {
        setResult(await api.result(attemptId));
        setPhase("result");
        return;
      }
      setState(s);
      setAnswers(s.answers);
      deadline.current = Date.now() + s.secondsLeft * 1000;
      setLeft(s.secondsLeft);
      setIdx(0);
      setPhase("exam");
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "Xatolik");
      setPhase(e?.status === 403 ? "closed" : "error");
    } finally {
      setBusy(false);
    }
  }, []);

  const finish = useCallback(async () => {
    if (!state || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      try {
        await flush();
      } catch (e: any) {
        if (e?.status !== 409) throw e; // 409: vaqt tugagan, baribir yakunlaymiz
      }
      setResult(await api.submit(state.attemptId));
      setPhase("result");
    } catch (e) {
      submitting.current = false;
      setError(e instanceof Error ? e.message : "Yakunlashda xatolik");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // taymer: faqat ko'rsatish uchun; haqiqiy deadline serverda
  useEffect(() => {
    if (phase !== "exam") return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) finish();
    }, 1000);
    return () => clearInterval(t);
  }, [phase, finish]);

  async function flush() {
    if (!state) return;
    for (const [key, value] of [...pending.current]) {
      await api.save(state.attemptId, key, value);
      if (pending.current.get(key) === value) pending.current.delete(key);
    }
  }

  const onChange = useCallback(
    async (key: string, value: string) => {
      if (!state) return;
      setAnswers((a) => {
        const n = { ...a };
        if (value === "") delete n[key];
        else n[key] = value;
        return n;
      });
      pending.current.set(key, value);
      setSaveStatus("saving");
      try {
        await flush();
        setSaveStatus("saved");
      } catch (e: any) {
        if (e?.status === 409) { finish(); return; } // vaqt tugagan
        setSaveStatus("failed"); // keyingi o'zgarishda yoki "Yakunlash" da qayta uriniladi
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, finish],
  );

  const questions = state?.questions ?? [];
  const answeredLabels = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) if (unitKeys(q).some((k) => answers[k])) set.add(q.label);
    return set;
  }, [questions, answers]);
  const fullyAnswered = useMemo(
    () => questions.filter((q) => unitKeys(q).every((k) => answers[k])).length,
    [questions, answers],
  );

  // savol almashganda sahifa boshidan ko'rsatiladi
  useEffect(() => {
    if (phase === "exam") window.scrollTo(0, 0);
  }, [idx, phase]);

  if (phase === "loading") return <main className="center">Yuklanmoqda…</main>;

  // 403: yopiq pilot, taklif kodi yo'q. Qayta urinish foyda bermaydi, kodni botga yuborish kerak
  if (phase === "closed")
    return (
      <main className="intro">
        <h1>DARAJA</h1>
        <p>{error}</p>
        <button className="btn primary" onClick={() => window.Telegram?.WebApp?.close()}>Botga qaytish</button>
      </main>
    );

  if (phase === "error")
    return (
      <main className="center">
        <p className="err">{error}</p>
        <button className="btn" onClick={() => { setError(""); setPhase("intro"); }}>Qaytadan</button>
      </main>
    );

  if (phase === "intro")
    return (
      <main className="intro">
        <h1>DARAJA</h1>
        <p>Tarix fanidan milliy sertifikat mock imtihoni</p>
        <ul>
          <li>45 ta topshiriq, 90 daqiqa</li>
          <li>Noto&apos;g&apos;ri javob uchun jarima yo&apos;q: bo&apos;sh qoldirmang</li>
          <li>Javoblar avtomatik saqlanadi. Ilovani yopsangiz, qaytib kirib davom ettirasiz</li>
          <li>Natija taxminiy: rasmiy Rasch hisobi emas</li>
        </ul>
        <button className="btn primary" onClick={begin} disabled={busy}>{busy ? "…" : "Imtihonni boshlash"}</button>
      </main>
    );

  if (phase === "result" && result) return <Result r={result} />;

  const q = questions[idx];
  return (
    <main className="exam">
      <header className="bar">
        <span className={`timer${left < 300 ? " warn" : ""}`} aria-live="off">{fmt(left)}</span>
        <span className="status" data-s={saveStatus}>{saveStatus === "saving" ? "Saqlanmoqda…" : saveStatus === "failed" ? "Saqlanmadi, qayta uriniladi" : saveStatus === "saved" ? "Saqlandi" : ""}</span>
        <button className="btn small" onClick={() => setConfirming(true)}>Yakunlash</button>
      </header>

      <button type="button" className="map-toggle" aria-expanded={mapOpen} aria-controls="qmap" onClick={() => setMapOpen((o) => !o)}>
        <span>Topshiriq <b>{idx + 1}</b> / {questions.length}</span>
        <span className="hint">Javoblangan: {answeredLabels.size}</span>
        <span aria-hidden="true">{mapOpen ? "▲" : "▼"}</span>
      </button>
      {mapOpen && (
        <nav id="qmap" className="map" aria-label="Savollar xaritasi">
          {questions.map((x, i) => (
            <button key={x.label} className={`dot${i === idx ? " current" : ""}${answeredLabels.has(x.label) ? " done" : ""}`} onClick={() => { setIdx(i); setMapOpen(false); }} aria-label={`${x.label}-topshiriq`} aria-current={i === idx ? "step" : undefined}>{x.label}</button>
          ))}
        </nav>
      )}

      {q && <QuestionView key={q.label} q={q} answers={answers} onChange={onChange} />}

      <footer className="nav">
        <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Oldingi</button>
        <button className="btn primary" disabled={idx === questions.length - 1} onClick={() => setIdx(idx + 1)}>Keyingi →</button>
      </footer>

      {confirming && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="sheet">
            <h3>Imtihonni yakunlaysizmi?</h3>
            <p>{fullyAnswered} / {questions.length} topshiriq to&apos;liq javoblangan. Qolgan vaqt: {fmt(left)}.</p>
            {error && <p className="err">{error}</p>}
            <div className="row">
              <button className="btn" onClick={() => setConfirming(false)} disabled={busy}>Davom etish</button>
              <button className="btn primary" onClick={finish} disabled={busy}>{busy ? "…" : "Yakunlash"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Result({ r }: { r: ResultDto }) {
  const wrong = r.units.filter((u) => !u.correct);
  return (
    <main className="result">
      <h1>Natija</h1>
      <div className="score">
        <div className="big">{r.scaledScore}<small> / 75</small></div>
        <div className="level">Daraja: <b>{r.level}</b></div>
        <div className="raw">Xom ball: {r.rawScore} / {r.maxRaw}</div>
      </div>
      <p className="disclaimer">{r.disclaimer} Daraja chegaralari rasmiy tasdiqlanmagan.</p>
      {r.status === "expired" && <p className="err">Vaqt tugadi, javoblaringiz avtomatik baholandi.</p>}
      <h2>Xatolar va javobsizlar ({wrong.length})</h2>
      <table className="review">
        <thead><tr><th>№</th><th>Sizning javob</th><th>To&apos;g&apos;ri javob</th></tr></thead>
        <tbody>
          {wrong.map((u) => (
            <tr key={u.key}><td>{u.key}</td><td>{u.given ?? "—"}</td><td>{u.expected}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="note">Ochiq savollarda boshqa to&apos;g&apos;ri yozilishlar ham qabul qilinishi mumkin: ko&apos;rsatilgani asosiy variant.</p>
    </main>
  );
}
