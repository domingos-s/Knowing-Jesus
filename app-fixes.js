// Small compatibility fixes kept separate so the static app remains easy to maintain.
// Intercept the lesson-level Question Box shortcut before app.js adds a query-string route.
document.addEventListener("click", (event) => {
  const button = event.target.closest?.("#questionFromLesson");
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  location.hash = "#/questions";
}, true);
