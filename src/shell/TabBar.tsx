import { Link } from "react-router-dom";
import { NAV_ITEMS, useActiveNav } from "./nav";
import styles from "./TabBar.module.css";

/** Below 900 px: bottom tab bar (frames H01–H03). */
export function TabBar() {
  const active = useActiveNav();
  return (
    <nav className={styles.bar} aria-label="Main">
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className={styles.tab}
          data-active={active === to}
          aria-current={active === to ? "page" : undefined}
        >
          <Icon size={24} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
