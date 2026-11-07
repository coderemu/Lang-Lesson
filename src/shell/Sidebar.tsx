import { Link } from "react-router-dom";
import { NAV_ITEMS, useActiveNav } from "./nav";
import styles from "./Sidebar.module.css";

/** From 900 px: left sidebar, 248 px (frames DH1–DH3). */
export function Sidebar() {
  const active = useActiveNav();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.name}>Lang Lessons</span>
        <span className={styles.sub}>BASIC MATHEMATICS</span>
      </div>
      <nav className={styles.nav} aria-label="Main">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={styles.item}
            data-active={active === to}
            aria-current={active === to ? "page" : undefined}
          >
            <Icon size={24} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
