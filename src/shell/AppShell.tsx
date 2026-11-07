import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import styles from "./AppShell.module.css";

/** Wraps Home, Progress, Rule book, Coverage and Settings. Lesson and practice routes have no shell. */
export function AppShell() {
  return (
    <div className={styles.shell}>
      <div className={styles.sidebarSlot}>
        <Sidebar />
      </div>
      <main className={styles.main}>
        <Outlet />
      </main>
      <div className={styles.tabSlot}>
        <TabBar />
      </div>
    </div>
  );
}
