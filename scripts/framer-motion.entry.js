// Entry for the vendored browser build of Framer Motion (see "build:motion" in package.json).
// The page has no bundler, so this re-exports the DOM API as a global `FramerMotion`.
export { animate, inView, stagger, hover, press } from "framer-motion/dom";
