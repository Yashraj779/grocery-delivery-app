import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

function Navbar({ cartCount, onToggleCart, userName, onLogout }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ""}`}>
      <div className={styles.brandArea}>
        <div className={styles.logo}>QuickBasket</div>
        <p className={styles.tagline}>Fresh groceries in minutes</p>
      </div>

      <div className={styles.actions}>
        <div className={styles.userPill}>
          <span className={styles.userLabel}>Hi</span>
          <span className={styles.userName}>{userName || "Guest"}</span>
        </div>

        <button className={styles.cartButton} onClick={onToggleCart} type="button">
          <span className={styles.cartIcon} aria-hidden="true">
            🛒
          </span>
          <span>Cart</span>
          <span key={cartCount} className={`${styles.count} ${styles.countPulse}`}>
            {cartCount}
          </span>
        </button>

        <button className={styles.logoutButton} onClick={onLogout} type="button">
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
