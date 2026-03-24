import styles from "./ProductCard.module.css";

function ProductCard({ product, onAdd, isAdding }) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <img className={styles.image} src={product.image} alt={product.name} />
        <span className={styles.category}>{product.category}</span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.price}>Rs {product.price}</p>

        <button
          className={styles.addButton}
          type="button"
          disabled={isAdding}
          onClick={() => onAdd(product)}
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
