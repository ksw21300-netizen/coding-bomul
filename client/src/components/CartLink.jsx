import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const API_BASE = 'http://localhost:4000';

function storedToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function CartLink() {
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const token = storedToken();
    if (!token) {
      setCount(0);
      return undefined;
    }

    let ignore = false;

    function load() {
      fetch(`${API_BASE}/api/carts`, { headers: { authorization: `Bearer ${token}` } })
        .then(async (response) => {
          if (ignore) return;
          if (!response.ok) {
            setCount(0);
            return;
          }
          const cart = await response.json();
          const total = Array.isArray(cart.items)
            ? cart.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
            : 0;
          setCount(total);
        })
        .catch(() => {
          if (!ignore) setCount(0);
        });
    }

    load();
    window.addEventListener('cart-updated', load);
    return () => {
      ignore = true;
      window.removeEventListener('cart-updated', load);
    };
  }, [location.pathname]);

  return (
    <Link className="cart-link" to="/cart" aria-label={`장바구니, ${count}개`}>
      <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
        <path fill="url(#cart-body)" d="M14 14h24l-2.4 14.2a3 3 0 0 1-3 2.5H18.2a3 3 0 0 1-2.9-2.4L14 14z" />
        <path fill="none" stroke="#5b2fd6" strokeWidth="2.6" strokeLinecap="round" d="M14 14H10L7 8" />
        <circle cx="20" cy="37" r="2.6" fill="#5b2fd6" />
        <circle cx="33" cy="37" r="2.6" fill="#5b2fd6" />
        <defs>
          <linearGradient id="cart-body" x1="14" y1="14" x2="38" y2="31" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7a5cff" />
            <stop offset="1" stopColor="#4b2ad4" />
          </linearGradient>
        </defs>
      </svg>
      <span className="cart-count">{count}</span>
    </Link>
  );
}

export default CartLink;
