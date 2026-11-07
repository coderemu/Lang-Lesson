import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components";
import pkg from "../../package.json";
import {
  backupFileName,
  dataOf,
  makeBackup,
  parseBackup,
  type BackupSummary,
} from "../store/backup";
import type { ProgressData } from "../store";
import { useProgress } from "../store";
import { PageHeader } from "./PageHeader";
import styles from "./Settings.module.css";
import app from "./app.module.css";

interface Pending {
  data: ProgressData;
  summary: BackupSummary;
}

export function Settings() {
  const unlockAll = useProgress((s) => s.settings.unlockAll);
  const setUnlockAll = useProgress((s) => s.setUnlockAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const backup = () => {
    const file = JSON.stringify(makeBackup(dataOf(useProgress.getState())), null, 2);
    const url = URL.createObjectURL(new Blob([file], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMessage({ kind: "ok", text: `Saved ${a.download}. Keep it in a safe place.` });
  };

  const onFile = async (file: File | undefined) => {
    setMessage(null);
    setPending(null);
    if (!file) return;
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    setPending({ data: result.data, summary: result.summary });
  };

  const restore = () => {
    if (!pending) return;
    useProgress.getState().replaceData(pending.data);
    setPending(null);
    setMessage({ kind: "ok", text: "Progress restored." });
    if (fileRef.current) fileRef.current.value = "";
  };

  const reset = () => {
    useProgress.getState().reset();
    setConfirmReset(false);
    setMessage({ kind: "ok", text: "Progress deleted." });
  };

  return (
    <div className={app.page}>
      <PageHeader label="BASIC MATHEMATICS · LANG" title="Settings" />

      <section className={`${app.card} ${app.cardPad}`} aria-label="Backup">
        <p className={app.eyebrow}>Backup</p>
        <p className={styles.help}>
          Your progress stays in this browser. Save a backup file to keep it safe or to move it to
          another device.
        </p>
        <div className={styles.buttons}>
          <Button variant="primary" onClick={backup}>
            Back up progress
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Restore from backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Backup file"
            data-testid="restore-input"
            tabIndex={-1}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </div>
        {pending && (
          <div className={styles.confirm} role="alertdialog" aria-label="Confirm restore">
            <p>
              This backup has {pending.summary.lessonsDone}{" "}
              {pending.summary.lessonsDone === 1 ? "lesson" : "lessons"} done and{" "}
              {pending.summary.rules} {pending.summary.rules === 1 ? "rule" : "rules"} earned
              {pending.summary.lastDate ? `. Last activity: ${pending.summary.lastDate}` : ""}.
              Restoring replaces your progress on this device.
            </p>
            <div className={styles.buttons}>
              <Button variant="secondary" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={restore} data-testid="confirm-restore">
                Replace my progress
              </Button>
            </div>
          </div>
        )}
        {message && (
          <p
            className={styles.message}
            data-kind={message.kind}
            role={message.kind === "error" ? "alert" : "status"}
          >
            {message.text}
          </p>
        )}
      </section>

      <section className={`${app.card} ${app.cardPad}`} aria-label="Lessons">
        <p className={app.eyebrow}>Lessons</p>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={unlockAll}
            onChange={(e) => setUnlockAll(e.target.checked)}
          />
          <span>
            <strong>Unlock all lessons</strong>
            <span className={styles.help}> For testing. Lessons open in any order.</span>
          </span>
        </label>
      </section>

      <section className={`${app.card} ${app.cardPad}`} aria-label="Danger zone">
        <p className={app.eyebrow}>Danger zone</p>
        {confirmReset ? (
          <div className={styles.confirm} role="alertdialog" aria-label="Confirm reset">
            <p>
              This deletes all lessons, banks, rules and time on this device. It cannot be undone.
              Make a backup first.
            </p>
            <div className={styles.buttons}>
              <Button variant="secondary" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className={styles.danger}
                onClick={reset}
                data-testid="confirm-reset"
              >
                Delete my progress
              </Button>
            </div>
          </div>
        ) : (
          <button type="button" className={styles.dangerLink} onClick={() => setConfirmReset(true)}>
            Reset progress
          </button>
        )}
      </section>

      <section className={`${app.card} ${app.cardPad}`} aria-label="About">
        <p className={app.eyebrow}>About</p>
        <p className={styles.help}>Lang Lessons · version {pkg.version}</p>
        <Link to="/design-system" className={app.link}>
          Design system
        </Link>
      </section>
    </div>
  );
}
