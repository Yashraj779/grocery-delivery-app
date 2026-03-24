import { useEffect, useMemo, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import CartItem from "../components/CartItem";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../contexts/AuthContext";
import {
  addToCart,
  getCart,
  getDelivery,
  getProducts,
  placeOrder,
  removeCartItem,
  updateCartItem,
  updateDelivery,
} from "../services/api";
import styles from "./Home.module.css";

const DELIVERY_STEPS = ["Preparing", "Packed", "Out for Delivery", "Delivered"];
const LAST_ORDER_KEY = "grocery:lastOrderId";

const normalizeCart = (cart) =>
  Array.isArray(cart)
    ? cart
        .map((item) => ({
          ...item,
          id: Number(item.id),
          price: Number(item.price) || 0,
          quantity: Math.max(1, Number(item.quantity) || 1),
        }))
        .filter((item) => Number.isFinite(item.id))
    : [];

const updateNested = (obj, key, val) => ({ ...obj, [key]: val });
const updateLoading = (state, key, val) => ({
  ...state,
  loading: updateNested(state.loading, key, val),
});
const updateErrors = (state, key, val) => ({
  ...state,
  errors: updateNested(state.errors, key, val),
});

const initialState = {
  products: [],
  cart: [],
  search: "",
  category: "All",
  isCartOpen: false,
  toast: "",
  delivery: { orderId: null, status: "No active order yet", timeline: DELIVERY_STEPS },
  loading: {
    initial: true,
    addProductId: null,
    incrementProductId: null,
    decrementProductId: null,
    removeProductId: null,
    placingOrder: false,
    updatingDelivery: false,
  },
  errors: { initial: "", action: "", delivery: "" },
};

function reducer(state, action) {
  const { type, payload } = action;
  switch (type) {
    case "SET_INITIAL_LOADING":
      return updateLoading(state, "initial", payload);
    case "BOOTSTRAP_SUCCESS":
      return { ...initialState, ...payload, loading: { ...initialState.loading, initial: false } };
    case "SET_INITIAL_ERROR":
      return updateErrors(state, "initial", payload);
    case "SET_CART":
      return { ...state, cart: payload };
    case "SET_DELIVERY":
      return {
        ...state,
        delivery: {
          orderId: payload.orderId,
          status: payload.status,
          timeline: payload.timeline || DELIVERY_STEPS,
        },
      };
    case "SET_SEARCH":
      return { ...state, search: payload };
    case "SET_CATEGORY":
      return { ...state, category: payload };
    case "TOGGLE_CART":
      return { ...state, isCartOpen: !state.isCartOpen };
    case "OPEN_CART":
      return { ...state, isCartOpen: true };
    case "CLOSE_CART":
      return { ...state, isCartOpen: false };
    case "SET_TOAST":
      return { ...state, toast: payload };
    case "SET_ACTION_ERROR":
      return updateErrors(state, "action", payload);
    case "SET_DELIVERY_ERROR":
      return updateErrors(state, "delivery", payload);
    case "SET_ADDING":
      return updateLoading(state, "addProductId", payload);
    case "SET_DECREMENTING":
      return updateLoading(state, "decrementProductId", payload);
    case "SET_INCREMENTING":
      return updateLoading(state, "incrementProductId", payload);
    case "SET_REMOVING":
      return updateLoading(state, "removeProductId", payload);
    case "SET_PLACING_ORDER":
      return updateLoading(state, "placingOrder", payload);
    case "SET_UPDATING_DELIVERY":
      return updateLoading(state, "updatingDelivery", payload);
    default:
      return state;
  }
}

const optimisticAdd = (cart, product) => {
  const existing = cart.find((item) => item.id === product.id);
  return existing
    ? cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
      )
    : [...cart, { ...product, quantity: 1 }];
};

const optimisticDecrement = (cart, productId) =>
  cart
    .map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
    )
    .filter((item) => item.quantity > 0);

const optimisticIncrement = (cart, productId) =>
  cart.map((item) =>
    item.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
  );

const formatError = (error) =>
  error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";

function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const cartCount = useMemo(
    () => state.cart.reduce((sum, item) => sum + item.quantity, 0),
    [state.cart],
  );

  const cartTotal = useMemo(
    () => state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.cart],
  );

  const categories = useMemo(() => {
    const set = new Set(state.products.map((item) => item.category).filter(Boolean));
    return ["All", ...set];
  }, [state.products]);

  const filteredProducts = useMemo(() => {
    return state.products.filter((product) => {
      const searchMatch = product.name
        .toLowerCase()
        .includes(state.search.trim().toLowerCase());
      const categoryMatch =
        state.category === "All" || product.category === state.category;

      return searchMatch && categoryMatch;
    });
  }, [state.products, state.search, state.category]);

  const activeDeliveryIndex = useMemo(
    () => DELIVERY_STEPS.indexOf(state.delivery.status),
    [state.delivery.status],
  );

  const syncCartFromServer = async () => {
    const serverCart = await getCart();
    dispatch({
      type: "SET_CART",
      payload: normalizeCart(serverCart),
    });
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      dispatch({ type: "SET_INITIAL_LOADING", payload: true });

      try {
        const [products, cart] = await Promise.all([getProducts(), getCart()]);

        const lastOrderId = Number(localStorage.getItem(LAST_ORDER_KEY));
        let delivery = {
          orderId: null,
          status: "No active order yet",
          timeline: DELIVERY_STEPS,
        };

        if (!Number.isNaN(lastOrderId) && lastOrderId > 0) {
          try {
            const deliveryData = await getDelivery(lastOrderId);
            delivery = {
              orderId: lastOrderId,
              status: deliveryData.status,
              timeline: deliveryData.timeline || DELIVERY_STEPS,
            };
          } catch {
            localStorage.removeItem(LAST_ORDER_KEY);
          }
        }

        if (!isMounted) {
          return;
        }

        dispatch({
          type: "BOOTSTRAP_SUCCESS",
          payload: {
            products: Array.isArray(products) ? products : [],
            cart: normalizeCart(cart),
            delivery,
          },
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        dispatch({ type: "SET_INITIAL_ERROR", payload: formatError(error) });
      } finally {
        if (isMounted) {
          dispatch({ type: "SET_INITIAL_LOADING", payload: false });
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: "SET_TOAST", payload: "" });
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [state.toast]);

  const handleAdd = async (product) => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    dispatch({ type: "SET_ACTION_ERROR", payload: "" });
    dispatch({ type: "SET_ADDING", payload: product.id });
    dispatch({ type: "SET_CART", payload: optimisticAdd(state.cart, product) });

    try {
      const response = await addToCart(product);
      if (Array.isArray(response?.cart)) {
        dispatch({ type: "SET_CART", payload: normalizeCart(response.cart) });
      }
      dispatch({ type: "SET_TOAST", payload: `${product.name} added to cart` });
    } catch (error) {
      try {
        await syncCartFromServer();
      } catch {
        // Silent fallback
      }
      dispatch({ type: "SET_ACTION_ERROR", payload: formatError(error) });
    } finally {
      dispatch({ type: "SET_ADDING", payload: null });
    }
  };

  const handleDecrease = async (productId) => {
    dispatch({ type: "SET_ACTION_ERROR", payload: "" });
    dispatch({ type: "SET_DECREMENTING", payload: productId });
    dispatch({ type: "SET_CART", payload: optimisticDecrement(state.cart, productId) });

    try {
      const response = await updateCartItem(productId, "decrement");
      if (Array.isArray(response?.cart)) {
        dispatch({ type: "SET_CART", payload: normalizeCart(response.cart) });
      }
    } catch (error) {
      try {
        await syncCartFromServer();
      } catch {
        // Silent fallback
      }
      dispatch({ type: "SET_ACTION_ERROR", payload: formatError(error) });
    } finally {
      dispatch({ type: "SET_DECREMENTING", payload: null });
    }
  };

  const handleIncrease = async (productId) => {
    dispatch({ type: "SET_ACTION_ERROR", payload: "" });
    dispatch({ type: "SET_INCREMENTING", payload: productId });
    dispatch({ type: "SET_CART", payload: optimisticIncrement(state.cart, productId) });

    try {
      const response = await updateCartItem(productId, "increment");
      if (Array.isArray(response?.cart)) {
        dispatch({ type: "SET_CART", payload: normalizeCart(response.cart) });
      }
    } catch (error) {
      try {
        await syncCartFromServer();
      } catch {
        // Silent fallback
      }
      dispatch({ type: "SET_ACTION_ERROR", payload: formatError(error) });
    } finally {
      dispatch({ type: "SET_INCREMENTING", payload: null });
    }
  };

  const handleRemove = async (productId) => {
    dispatch({ type: "SET_ACTION_ERROR", payload: "" });
    dispatch({ type: "SET_REMOVING", payload: productId });
    dispatch({
      type: "SET_CART",
      payload: state.cart.filter((item) => item.id !== productId),
    });

    try {
      const response = await removeCartItem(productId);
      if (Array.isArray(response?.cart)) {
        dispatch({ type: "SET_CART", payload: normalizeCart(response.cart) });
      }
    } catch (error) {
      try {
        await syncCartFromServer();
      } catch {
        // Silent fallback
      }
      dispatch({ type: "SET_ACTION_ERROR", payload: formatError(error) });
    } finally {
      dispatch({ type: "SET_REMOVING", payload: null });
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    dispatch({ type: "SET_ACTION_ERROR", payload: "" });
    dispatch({ type: "SET_DELIVERY_ERROR", payload: "" });

    if (!state.cart.length) {
      dispatch({ type: "SET_ACTION_ERROR", payload: "Your cart is empty." });
      return;
    }

    dispatch({ type: "SET_PLACING_ORDER", payload: true });

    try {
      const response = await placeOrder();
      const orderId = response?.orderId;
      const success = response?.success;
      const message = response?.message;
      const status = response?.status;

      if (
        typeof success !== "boolean" ||
        typeof message !== "string" ||
        typeof status !== "string" ||
        typeof orderId !== "number"
      ) {
        throw new Error("Invalid order response from server");
      }

      let deliveryData = { status, timeline: DELIVERY_STEPS };
      try {
        const latestDelivery = await getDelivery(orderId);
        deliveryData = {
          status: latestDelivery?.status || status,
          timeline: latestDelivery?.timeline || DELIVERY_STEPS,
        };
      } catch {
        dispatch({
          type: "SET_DELIVERY_ERROR",
          payload: "Order placed, but delivery status refresh failed. Try update.",
        });
      }

      localStorage.setItem(LAST_ORDER_KEY, String(orderId));

      dispatch({ type: "SET_CART", payload: [] });
      dispatch({
        type: "SET_DELIVERY",
        payload: {
          orderId,
          status: deliveryData.status,
          timeline: deliveryData.timeline || DELIVERY_STEPS,
        },
      });
      dispatch({ type: "SET_TOAST", payload: `Order #${orderId} placed successfully` });
      dispatch({ type: "OPEN_CART" });
    } catch (error) {
      dispatch({ type: "SET_ACTION_ERROR", payload: formatError(error) });
    } finally {
      dispatch({ type: "SET_PLACING_ORDER", payload: false });
    }
  };

  const handleUpdateDelivery = async () => {
    dispatch({ type: "SET_DELIVERY_ERROR", payload: "" });

    if (typeof state.delivery.orderId !== "number") {
      dispatch({ type: "SET_DELIVERY_ERROR", payload: "Place an order to track delivery." });
      return;
    }

    dispatch({ type: "SET_UPDATING_DELIVERY", payload: true });

    try {
      const response = await updateDelivery(state.delivery.orderId);
      dispatch({
        type: "SET_DELIVERY",
        payload: {
          orderId: state.delivery.orderId,
          status: response.status,
          timeline: response.timeline || DELIVERY_STEPS,
        },
      });

      if (response.status === "Delivered") {
        dispatch({ type: "SET_TOAST", payload: "Delivery completed" });
      }
    } catch (error) {
      dispatch({ type: "SET_DELIVERY_ERROR", payload: formatError(error) });
    } finally {
      dispatch({ type: "SET_UPDATING_DELIVERY", payload: false });
    }
  };

  return (
    <div className={styles.pageWrap}>
      <Navbar
        cartCount={cartCount}
        onToggleCart={() => dispatch({ type: "TOGGLE_CART" })}
        userName={user?.name}
        onLogout={() => {
          logout();
          navigate("/login", { replace: true });
        }}
      />

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>Groceries that arrive before your coffee cools down.</h1>
          <p>
            Hand-picked daily essentials from local stores. Fast checkout,
            transparent delivery tracking, and smooth cart updates.
          </p>
        </section>

        <section className={styles.controls}>
          <input
            className={styles.search}
            type="search"
            placeholder="Search groceries..."
            value={state.search}
            onChange={(e) => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
          />

          <div className={styles.filters}>
            {categories.map((category) => (
              <button
                className={`${styles.filterChip} ${
                  state.category === category ? styles.filterChipActive : ""
                }`}
                key={category}
                onClick={() => dispatch({ type: "SET_CATEGORY", payload: category })}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.contentArea}>
          <div className={styles.productsCol}>
            {state.loading.initial ? (
              <Loader lines={8} />
            ) : state.errors.initial ? (
              <div className={styles.errorBlock}>
                <p>{state.errors.initial}</p>
                <button type="button" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.emptyProducts}>
                <p>No products match your search.</p>
              </div>
            ) : (
              <div className={styles.productsGrid}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={handleAdd}
                    isAdding={state.loading.addProductId === product.id}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className={styles.deliveryCol}>
            <div className={styles.deliveryCard}>
              <h2>Delivery Tracking</h2>
              <p className={styles.orderMeta}>
                {typeof state.delivery.orderId === "number"
                  ? `Order #${state.delivery.orderId}`
                  : "No active order"}
              </p>
              <p className={styles.deliveryStatus}>{state.delivery.status}</p>

              <ol className={styles.timeline}>
                {DELIVERY_STEPS.map((step, index) => {
                  const isCompleted =
                    activeDeliveryIndex >= 0 && index < activeDeliveryIndex;
                  const isCurrent = index === activeDeliveryIndex;

                  return (
                    <li
                      className={`${styles.timelineItem} ${
                        isCompleted ? styles.completed : ""
                      } ${isCurrent ? styles.current : ""}`}
                      key={step}
                    >
                      <span className={styles.stepIcon} aria-hidden="true"></span>
                      <span>{step}</span>
                    </li>
                  );
                })}
              </ol>

              <button
                className={styles.updateBtn}
                disabled={
                  state.loading.updatingDelivery ||
                  typeof state.delivery.orderId !== "number"
                }
                onClick={handleUpdateDelivery}
                type="button"
              >
                {state.loading.updatingDelivery ? "Updating..." : "Update Delivery"}
              </button>

              <button
                className={styles.orderBtn}
                disabled={state.loading.placingOrder || state.cart.length === 0}
                onClick={handlePlaceOrder}
                type="button"
              >
                {state.loading.placingOrder ? "Placing order..." : "Place New Order"}
              </button>

              {(state.errors.action || state.errors.delivery) && (
                <p className={styles.errorText}>
                  {state.errors.action || state.errors.delivery}
                </p>
              )}
            </div>
          </aside>
        </section>
      </main>

      <aside
        className={`${styles.cartSidebar} ${
          state.isCartOpen ? styles.cartSidebarOpen : ""
        }`}
      >
        <div className={styles.cartHeader}>
          <h3>Your Cart</h3>
          <button
            className={styles.closeBtn}
            onClick={() => dispatch({ type: "CLOSE_CART" })}
            type="button"
          >
            Close
          </button>
        </div>

        {state.cart.length === 0 ? (
          <div className={styles.emptyCart}>
            <p>Your cart is empty.</p>
            <span>Add products to start your order.</span>
          </div>
        ) : (
          <div className={styles.cartItems}>
            {state.cart.map((item) => {
              const isBusy =
                state.loading.addProductId === item.id ||
                state.loading.incrementProductId === item.id ||
                state.loading.decrementProductId === item.id ||
                state.loading.removeProductId === item.id;

              return (
                <CartItem
                  item={item}
                  key={item.id}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onRemove={handleRemove}
                  isBusy={isBusy}
                />
              );
            })}
          </div>
        )}

        <div className={styles.cartFooter}>
          <div>
            <p className={styles.totalLabel}>Total</p>
            <p className={styles.totalValue}>Rs {cartTotal}</p>
          </div>
          <button
            className={styles.checkoutBtn}
            disabled={state.loading.placingOrder || state.cart.length === 0}
            onClick={handlePlaceOrder}
            type="button"
          >
            {state.loading.placingOrder ? "Placing..." : "Checkout"}
          </button>
        </div>
      </aside>

      {state.isCartOpen && (
        <div
          className={styles.overlay}
          onClick={() => dispatch({ type: "CLOSE_CART" })}
          role="presentation"
        />
      )}

      {state.toast && <div className={styles.toast}>{state.toast}</div>}
    </div>
  );
}

export default Home;
