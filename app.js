(() => {
  const STORAGE_KEY = "knowingJesus.learning.v1";
  const app = document.getElementById("app");
  const backButton = document.getElementById("backButton");
  const homeButton = document.getElementById("homeButton");
  const questionsButton = document.getElementById("questionsButton");
  let installPrompt = null;

  const defaultState = () => ({
    completed: [],
    reflections: {},
    journals: {},
    questions: []
  });

  let state = loadState();

  function loadState() {
    try {
      return { ...defaultState(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function esc(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function go(route) {
    if (location.hash === route) render();
    else location.hash = route;
  }

  function toast(message) {
    document.querySelector(".toast")?.remove();
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 1600);
  }

  function render() {
    const hash = location.hash || "#/";
    window.scrollTo(0, 0);
    backButton.hidden = hash === "#/";

    if (hash === "#/" || hash === "#") renderHome();
    else if (hash === "#/questions") renderQuestions();
    else if (hash === "#/baptism") renderBaptismInfo();
    else if (hash.startsWith("#/lesson/")) renderLesson(Number(hash.split("/").pop()));
    else return go("#/");

    document.querySelectorAll(".nav-item").forEach((button) => {
      const route = button.dataset.route;
      const active = route === "#/"
        ? hash === "#/" || hash.startsWith("#/lesson/")
        : hash === route;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    app.focus({ preventScroll: true });
  }

  function renderHome() {
    const count = window.LESSONS.filter((lesson) => state.completed.includes(lesson.id)).length;
    const pct = Math.round((count / window.LESSONS.length) * 100);

    app.innerHTML = `
      <section class="hero">
        <span class="eyebrow">Explore at your own pace</span>
        <h1>Who is Jesus?</h1>
        <p>Read Scripture, talk openly, write down what you think, and keep questions that deserve more time. Exploring a lesson does not require agreeing with it.</p>
        <div class="progress-wrap">
          <div class="progress-label"><span>${count} of ${window.LESSONS.length} lessons explored</span><span>${pct}%</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      </section>

      <div class="section-heading">
        <div><h2>The Journey</h2><p>Open any lesson to begin or revisit it.</p></div>
      </div>

      <section class="path-list">
        ${window.LESSONS.map((lesson) => {
          const complete = state.completed.includes(lesson.id);
          return `
            <button class="lesson-card ${complete ? "complete" : ""}" type="button" data-go="#/lesson/${lesson.id}">
              <span class="lesson-icon" aria-hidden="true">${lesson.icon}</span>
              <span><strong>${lesson.id}. ${esc(lesson.title)}</strong><small>${esc(lesson.question)}</small></span>
              <span class="card-status">${complete ? "✓" : "›"}</span>
            </button>`;
        }).join("")}
      </section>

      <section class="callout-card">
        <h3>Questions belong here.</h3>
        <p>Save anything that seems confusing, difficult, interesting, or worth investigating later.</p>
        <div class="button-row">
          <button class="secondary-button" type="button" data-go="#/questions">Open Question Box</button>
          ${installPrompt ? '<button class="primary-button" type="button" id="installButton">Install app</button>' : ""}
        </div>
      </section>

      <section class="callout-card baptism-intro">
        <h3>About baptism</h3>
        <p>The baptism section explains what Christians mean by baptism and provides open-ended discussion prompts. It is separate from lesson progress.</p>
        <div class="button-row"><button class="secondary-button" type="button" data-go="#/baptism">Explore baptism</button></div>
      </section>
    `;

    wireLinks(app);
    document.getElementById("installButton")?.addEventListener("click", installApp);
  }

  function renderLesson(id) {
    const lesson = window.LESSONS.find((item) => item.id === id);
    if (!lesson) return go("#/");
    const complete = state.completed.includes(id);

    app.innerHTML = `
      <article>
        <header class="lesson-head">
          <div class="lesson-number">Lesson ${lesson.id} of ${window.LESSONS.length}</div>
          <h1>${esc(lesson.title)}</h1>
          <p class="big-question"><strong>Big question:</strong> ${esc(lesson.question)}</p>
        </header>

        <div class="reading-strip"><span>Bible reading</span><strong>${esc(lesson.reading)}</strong></div>

        <section class="content-card lesson-body">
          <h2>Read Together</h2>
          ${lesson.body.map((p) => `<p>${esc(p)}</p>`).join("")}
        </section>

        <section class="content-card">
          <h2>Talk About It</h2>
          <ol class="prompt-list">${lesson.talk.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>
        </section>

        <section class="content-card reflection-card">
          <h2>Think About It</h2>
          <p>${esc(lesson.think)}</p>
          <textarea id="reflection" placeholder="Write what you think…">${esc(state.reflections[id] || "")}</textarea>
          <small class="save-note">Saved only on this device.</small>
        </section>

        <section class="content-card prayer-card">
          <h2>Prayer</h2>
          <p>${esc(lesson.prayer)}</p>
        </section>

        <section class="content-card takeaway-card">
          <h2>Takeaway</h2>
          <p>${esc(lesson.takeaway)}</p>
        </section>

        <section class="content-card">
          <h2>My Journal</h2>
          <p>Save anything you want to remember, question, disagree with, or discuss later.</p>
          <textarea id="journal" placeholder="Private notes…">${esc(state.journals[id] || "")}</textarea>
          <small class="save-note">Saved only on this device.</small>
          <div class="button-row"><button class="secondary-button" type="button" id="questionFromLesson">Add a question</button></div>

          <div class="complete-panel">
            <button class="${complete ? "secondary-button" : "primary-button"}" type="button" id="completeButton">${complete ? "✓ Marked as explored" : "Mark lesson as explored"}</button>
            <p>“Explored” only tracks where you've been. It does not mean you agree with the lesson.</p>
          </div>
        </section>

        <div class="button-row">
          ${id > 1 ? `<button class="secondary-button" type="button" data-go="#/lesson/${id - 1}">← Previous</button>` : ""}
          ${id < window.LESSONS.length ? `<button class="primary-button" type="button" data-go="#/lesson/${id + 1}">Next lesson →</button>` : `<button class="primary-button" type="button" data-go="#/baptism">Explore baptism →</button>`}
        </div>
      </article>`;

    wireLinks(app);

    document.getElementById("reflection").addEventListener("input", (event) => {
      state.reflections[id] = event.target.value;
      saveState();
    });
    document.getElementById("journal").addEventListener("input", (event) => {
      state.journals[id] = event.target.value;
      saveState();
    });
    document.getElementById("completeButton").addEventListener("click", () => {
      state.completed = complete
        ? state.completed.filter((lessonId) => lessonId !== id)
        : [...new Set([...state.completed, id])].sort((a, b) => a - b);
      saveState();
      toast(complete ? "Explored marker removed" : "Lesson marked explored");
      setTimeout(() => renderLesson(id), 180);
    });
    document.getElementById("questionFromLesson").addEventListener("click", () => {
      go(`#/questions?lesson=${id}`);
    });
  }

  function renderQuestions() {
    app.innerHTML = `
      <header class="lesson-head">
        <div class="lesson-number">Question Box</div>
        <h1>Keep the hard questions.</h1>
        <p class="big-question">Save anything you want to investigate, discuss, or return to later.</p>
      </header>

      <section class="content-card">
        <form class="question-form" id="questionForm">
          <label for="newQuestion"><strong>What's on your mind?</strong></label>
          <textarea id="newQuestion" placeholder="Example: How do we know the resurrection really happened?"></textarea>
          <button class="primary-button" type="submit">Save question</button>
        </form>
      </section>

      <div class="section-heading"><div><h2>Saved Questions</h2><p>${state.questions.length} saved</p></div></div>
      <section>
        ${state.questions.length ? state.questions.map((item) => `
          <article class="question-item">
            <div><p>${esc(item.text)}</p><small>${esc(item.source || "Question Box")}</small></div>
            <button class="question-delete" type="button" data-delete="${esc(item.id)}" aria-label="Delete question">×</button>
          </article>`).join("") : '<div class="empty-state">No questions saved yet.</div>'}
      </section>`;

    const params = new URLSearchParams((location.hash.split("?")[1] || ""));
    const lessonId = Number(params.get("lesson"));
    const sourceLesson = window.LESSONS.find((lesson) => lesson.id === lessonId);

    document.getElementById("questionForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.getElementById("newQuestion");
      if (!input.value.trim()) return;
      state.questions.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        text: input.value.trim(),
        source: sourceLesson ? `Lesson ${sourceLesson.id}: ${sourceLesson.title}` : "Question Box"
      });
      saveState();
      location.hash = "#/questions";
      renderQuestions();
      toast("Question saved");
    });

    document.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        state.questions = state.questions.filter((item) => item.id !== button.dataset.delete);
        saveState();
        renderQuestions();
      });
    });
  }

  function renderBaptismInfo() {
    app.innerHTML = `
      <header class="lesson-head">
        <div class="lesson-number">Christian practice</div>
        <h1>What is baptism?</h1>
        <p class="big-question">A discussion page about what baptism means in Christianity and why different traditions practice it.</p>
      </header>

      <section class="content-card baptism-intro">
        <h2>What Christians broadly share</h2>
        <p>Christian traditions differ on the timing, method, and theological role of baptism. Across traditions, baptism is connected with Jesus, Christian identity, belonging to the church, and new life.</p>
        <p>Some churches baptize infants; others reserve baptism for people who personally profess faith. Some immerse a person in water; others pour or sprinkle water.</p>
      </section>

      <section class="content-card">
        <h2>Read Together</h2>
        <div class="reading-strip"><span>Bible reading</span><strong>Matthew 28:18–20 · Acts 2:37–41 · Romans 6:3–4</strong></div>
      </section>

      <section class="content-card">
        <h2>Discuss</h2>
        <ol class="baptism-list">
          ${window.BAPTISM_QUESTIONS.map((question) => `<li>${esc(question)}</li>`).join("")}
        </ol>
      </section>

      <section class="callout-card">
        <h3>No progress requirement</h3>
        <p>This page is intentionally separate from the lesson progress tracker. Exploring Christianity and understanding baptism are not the same thing as making a religious commitment.</p>
      </section>`;
  }

  function wireLinks(root) {
    root.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => go(button.dataset.go)));
  }

  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    renderHome();
  }

  homeButton.addEventListener("click", () => go("#/"));
  questionsButton.addEventListener("click", () => go("#/questions"));
  backButton.addEventListener("click", () => history.back());
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => go(button.dataset.route)));

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    if ((location.hash || "#/") === "#/") renderHome();
  });
  window.addEventListener("hashchange", render);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }

  if (!location.hash) history.replaceState(null, "", "#/");
  render();
})();
