import { xOf } from "./geometry";
import styles from "./widgets.module.css";

/** The picture of the rule card (frame S05): a and −a are mirror points across 0. */
export function MirrorPicture() {
  const min = -5;
  const max = 5;
  const a = 3;
  const w = 300;
  const x = (v: number) => 24 + ((v - min) / (max - min)) * (w - 48);
  const y = 50;
  void xOf;
  return (
    <svg
      className={styles.picture}
      viewBox={`0 0 ${w} 84`}
      role="img"
      aria-label="The numbers a and minus a are mirror points on the two sides of 0."
    >
      <line x1={8} x2={w - 8} y1={y} y2={y} className={styles.axis} />
      {Array.from({ length: 11 }, (_, i) => min + i).map((v) => (
        <line
          key={v}
          x1={x(v)}
          x2={x(v)}
          y1={y - (v === 0 ? 10 : 5)}
          y2={y + (v === 0 ? 10 : 5)}
          className={styles.tick}
        />
      ))}
      <line x1={x(0)} x2={x(0)} y1={14} y2={y - 12} className={styles.mirrorAxis} />
      <text x={x(0)} y={74} className={styles.tickLabel} data-zero="true">
        0
      </text>
      <circle cx={x(-a)} cy={y} r={6} className={styles.dotMinusAThin} />
      <circle cx={x(a)} cy={y} r={6} className={styles.dotA} />
      <text x={x(-a)} y={32} className={styles.pictureVar}>
        −a
      </text>
      <text x={x(a)} y={32} className={styles.pictureVar}>
        a
      </text>
    </svg>
  );
}
