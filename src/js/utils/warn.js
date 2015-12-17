export default function warn(message) {
  if (!window.console) { return; }

  message = `WARNING: ${message}`;
  if (window.console.warn) {
    window.console.warn(message);
  } else if (window.console.log) {
    window.console.log(message);
  }
}
