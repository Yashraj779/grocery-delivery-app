import styles from "./Loader.module.css";

function Loader({ lines = 6 }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div className={styles.card} key={idx}>
          <div className={styles.image} />
          <div className={styles.row} />
          <div className={styles.rowShort} />
          <div className={styles.button} />
        </div>
      ))}
    </div>
  );
}

export default Loader;
