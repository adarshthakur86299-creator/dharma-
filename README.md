# PROJECT DHARMA

PROJECT DHARMA is a responsive, dependency-free practice app. Each main feature has a separate page, with test history saved in the current browser's local storage.

## Run locally

Open `index.html` in a browser. The app does not need Python, a database, an account, an API key, or package installation.

## Open on a phone

Put the project files on a static web host, or serve the project folder from a computer on the same Wi-Fi network and open that computer's address on the phone. The app's question sets are bundled in its JavaScript and work without an app-specific server. Browser storage is device- and browser-specific, so practice history is not shared between a phone and computer.

## Pages

- `index.html` — homepage and buttons to every feature
- `test.html` — timed tests, subject practice, result summaries, and recent sessions
- `practice.html` — untimed, topic-based practice
- `categories.html` — topic selection with direct practice links
- `dashboard.html` — saved progress, accuracy trend, and session history
- `about.html` — platform overview and difficulty levels

## Features

- JEE Mathematics, Physics, and Chemistry; SSC Quantitative Aptitude, Reasoning, English, and General Awareness
- 100 original multiple-choice questions per subject, each with four options, an answer, explanation, and quick-solving tip
- No question repeats for a subject until all 100 have been shown; a fresh round then begins
- No-repeat progress and test history are saved in the current browser's local storage
- Quick, speed, accuracy, mixed-topic, and custom timed tests
- Ten generated calculation topics across five difficulty levels
- Answer checking, skip support, live timer, streaks, and session results
- Short Hindi mental-math tips on calculation questions
- Responsive layout and keyboard answer submission

Subject question sets are bundled in `subject-questions.js`; no TXT question folders or Python question server are used. Subject practice sets are original sample questions, not official exam papers. Clearing browser storage removes saved progress. Accounts, leaderboards, achievements, and daily challenges are not part of this first phase.
