import styles from "./CartItem.module.css";

function CartItem({ item, isBusy, onIncrease, onDecrease, onRemove }) {
  return (
    <div className={styles.item}>
      <img className={styles.thumb} src={item.image} alt={item.name} />

      <div className={styles.info}>
        <p className={styles.name}>{item.name}</p>
        <p className={styles.price}>Rs {item.price}</p>

        <div className={styles.controls}>
          <button type="button" disabled={isBusy} onClick={() => onDecrease(item.id)}>
            -
          </button>
          <span>{item.quantity}</span>
          <button type="button" disabled={isBusy} onClick={() => onIncrease(item.id)}>
            +
          </button>
        </div>
      </div>

      <button
        className={styles.removeBtn}
        type="button"
        disabled={isBusy}
        onClick={() => onRemove(item.id)}
      >
        Remove
      </button>
    </div>
  );
}

export default CartItem;
