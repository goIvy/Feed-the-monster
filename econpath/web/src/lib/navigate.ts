/**
 * Programmatic navigation that also works when the site is served as plain
 * files under an unknown path prefix (the static export). The export's
 * bootstrap script defines `window.__econpathHref`, which maps an app route
 * such as "/dashboard?welcome=1" to the right file; otherwise use the router.
 */
type Router = { push: (href: string, opts?: { scroll?: boolean }) => void; replace: (href: string, opts?: { scroll?: boolean }) => void };

declare global {
  interface Window {
    __econpathHref?: (href: string) => string;
  }
}

export function navigate(router: Router, href: string, { replace = false }: { replace?: boolean } = {}) {
  if (typeof window !== "undefined" && window.__econpathHref) {
    const url = window.__econpathHref(href);
    if (replace) window.location.replace(url);
    else window.location.assign(url);
    return;
  }
  if (replace) router.replace(href, { scroll: false });
  else router.push(href);
}
