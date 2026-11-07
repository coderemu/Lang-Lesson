import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "../components";
import styles from "./UpdateToast.module.css";

/** NFR-11: a new deploy shows "New version ready. Reload." Progress is in localStorage and is not touched. */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className={styles.toast} role="status" aria-live="polite" data-testid="update-toast">
      <p className={styles.text}>New version ready. Reload.</p>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
        <Button variant="primary" onClick={() => void updateServiceWorker(true)}>
          Reload
        </Button>
      </div>
    </div>
  );
}
