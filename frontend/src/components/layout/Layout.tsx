import { ArrowUpRight, CreditCard, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

export function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="nav-inner">
          <Link className="brand" to="/" onClick={() => setOpen(false)}>
            <span className="brand-mark">
              <CreditCard size={21} />
            </span>
            CardMatch<span className="brand-dot">.</span>
          </Link>
          <button
            className="menu-button icon-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav
            className={open ? "nav-links is-open" : "nav-links"}
            aria-label="Main navigation"
            onClick={() => setOpen(false)}
          >
            <NavLink to="/guided">Find your card</NavLink>
            <NavLink to="/compare">Compare</NavLink>
            <Link to="/#how-it-works">How it works</Link>
            <Link className="button small" to="/guided">
              Get matched <ArrowUpRight size={16} />
            </Link>
          </nav>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <Link className="brand" to="/">
            CardMatch<span className="brand-dot">.</span>
          </Link>
          <span>A little clarity. A better match.</span>
          <Link to="/about">
            About & methodology <ArrowUpRight size={14} />
          </Link>
        </div>
        <p>
          For informational purposes. Recommendations reflect your preferences
          and do not guarantee approval. Card terms and offers can change.
          Verify current terms with the issuer before applying.
        </p>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} CardMatch</span>
          <span>
            Data adapted from{" "}
            <a href="https://67.credit/data" target="_blank" rel="noreferrer">
              67.CREDIT
            </a>{" "}
            ·{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}
