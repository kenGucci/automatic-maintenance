const GENERAL_KB = [
  { keywords: ['python', 'programming', 'language'], answer: 'Python is a high-level, interpreted programming language known for readability and versatility. It\'s widely used in web development, data science, AI, and automation. Created by Guido van Rossum in 1991.' },
  { keywords: ['javascript', 'js', 'ecmascript'], answer: 'JavaScript is a dynamic programming language essential for web development. It runs in browsers and on servers (Node.js). Created by Brendan Eich in 1995.' },
  { keywords: ['react', 'reactjs', 'frontend', 'component'], answer: 'React is a JavaScript library for building user interfaces, developed by Meta (Facebook). It uses a component-based architecture and a virtual DOM for efficient rendering.' },
  { keywords: ['node', 'nodejs', 'runtime', 'server'], answer: 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine. It lets you run JavaScript on the server side, perfect for building fast, scalable network applications.' },
  { keywords: ['docker', 'container', 'kubernetes', 'orchestration'], answer: 'Docker packages applications into lightweight containers that run consistently anywhere. Kubernetes orchestrates those containers across clusters. Together they form the backbone of modern cloud-native infrastructure.' },
  { keywords: ['git', 'version', 'control', 'github'], answer: 'Git is a distributed version control system created by Linus Torvalds. It tracks changes in source code during development. GitHub is a cloud platform for hosting Git repositories.' },
  { keywords: ['linux', 'unix', 'command', 'terminal', 'bash'], answer: 'Linux is a free, open-source operating system kernel created by Linus Torvalds. It powers most servers, Android devices, and cloud infrastructure. The command line (bash) is its primary interface.' },
  { keywords: ['api', 'rest', 'restful', 'endpoint', 'http'], answer: 'REST API is a web service architecture that uses HTTP methods (GET, POST, PUT, DELETE) to perform operations on resources. It\'s the most common way for services to communicate over the web.' },
  { keywords: ['sql', 'database', 'nosql', 'mongodb', 'postgres', 'mysql'], answer: 'Databases store and retrieve structured data. SQL databases (PostgreSQL, MySQL) use tables and relationships. NoSQL databases (MongoDB) use flexible documents. Each suits different use cases.' },
  { keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning'], answer: 'AI is the broad field of creating intelligent machines. Machine Learning is a subset where systems learn from data. Deep Learning uses neural networks with multiple layers for complex pattern recognition.' },
  { keywords: ['llm', 'large language model', 'gpt', 'claude', 'chatgpt', 'ai model'], answer: 'Large Language Models (LLMs) like Claude, GPT-4, and Gemini are trained on vast text data to understand and generate human-like text. They excel at conversation, analysis, coding, and creative tasks.' },
  { keywords: ['neural', 'network', 'deep', 'training', 'model'], answer: 'Neural networks are computing systems inspired by biological brains. They consist of layers of interconnected nodes (neurons) that learn patterns from data through training, adjusting connection weights.' },
  { keywords: ['cloud', 'aws', 'azure', 'gcp', 'google cloud', 'amazon'], answer: 'Cloud computing delivers computing services over the internet. AWS (Amazon), Azure (Microsoft), and GCP (Google) are the three major providers, offering everything from virtual machines to AI services.' },
  { keywords: ['html', 'css', 'web', 'website', 'frontend'], answer: 'HTML structures web content, CSS styles it. Together they form the foundation of every website. Modern CSS (Grid, Flexbox, variables) enables complex responsive layouts without JavaScript.' },
  { keywords: ['typescript', 'ts', 'static', 'typing'], answer: 'TypeScript is a typed superset of JavaScript that compiles to plain JS. It adds optional static typing, interfaces, and modern features, catching errors during development. Developed by Microsoft.' },
  { keywords: ['oop', 'object', 'oriented', 'class', 'inheritance'], answer: 'Object-Oriented Programming (OOP) organizes code into objects containing data and methods. Key concepts: encapsulation, inheritance, polymorphism, and abstraction. Used in Java, C++, Python, and more.' },
  { keywords: ['functional', 'programming', 'lambda', 'pure', 'immutable'], answer: 'Functional programming treats computation as evaluating mathematical functions, avoiding mutable state and side effects. Key concepts: pure functions, immutability, higher-order functions, and recursion.' },
  { keywords: ['algorithm', 'complexity', 'big o', 'performance', 'efficient'], answer: 'Big O notation describes algorithm efficiency. O(1) is constant time, O(log n) is logarithmic, O(n) is linear, O(n²) is quadratic. Good algorithms minimize time and space complexity.' },
  { keywords: ['blockchain', 'bitcoin', 'crypto', 'ethereum', 'web3'], answer: 'Blockchain is a distributed ledger technology where data is stored in linked blocks. Bitcoin pioneered it for cryptocurrency. Ethereum added smart contracts. Web3 envisions a decentralized internet.' },
  { keywords: ['cybersecurity', 'security', 'hack', 'vulnerability', 'encryption'], answer: 'Cybersecurity protects systems from digital attacks. Key practices: strong passwords, 2FA, regular updates, encryption, least-privilege access, and security audits. Never trust, always verify (zero trust).' },
  { keywords: ['data', 'science', 'analytics', 'visualization', 'statistics'], answer: 'Data science extracts insights from data using statistics, programming, and domain knowledge. Tools: Python (pandas, numpy), R, SQL. Visualization libraries like matplotlib and D3.js help communicate findings.' },
  { keywords: ['devops', 'ci', 'cd', 'pipeline', 'automation', 'deploy'], answer: 'DevOps combines software development and IT operations. CI/CD (Continuous Integration/Deployment) automates building, testing, and deploying code. Tools: GitHub Actions, Jenkins, GitLab CI.' },
  { keywords: ['microservice', 'monolith', 'architecture', 'distributed'], answer: 'Microservices architecture breaks applications into small, independent services that communicate via APIs. Monoliths are single unified units. Microservices offer scalability but add complexity in distributed systems.' },
  { keywords: ['agile', 'scrum', 'sprint', 'kanban', 'methodology'], answer: 'Agile is an iterative approach to software development. Scrum uses fixed-length sprints (usually 2 weeks) with daily standups. Kanban visualizes workflow on boards, limiting work in progress.' },
  { keywords: ['test', 'testing', 'unit', 'integration', 'e2e', 'qa'], answer: 'Software testing ensures quality. Unit tests check individual functions. Integration tests verify component interactions. E2E (end-to-end) tests simulate real user scenarios. TDD writes tests before code.' },
  { keywords: ['world', 'earth', 'planet', 'ocean', 'continent', 'population'], answer: 'Earth is the third planet from the Sun, about 4.5 billion years old. It\'s 71% water, has 7 continents, and a population of roughly 8 billion people. The atmosphere is 78% nitrogen, 21% oxygen.' },
  { keywords: ['solar', 'system', 'planet', 'sun', 'moon', 'mars', 'venus'], answer: 'Our solar system has 8 planets orbiting the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. Jupiter is the largest, Mercury the smallest. The Sun is a G-type main-sequence star.' },
  { keywords: ['evolution', 'dinosaur', 'species', 'darwin', 'biology'], answer: 'Evolution by natural selection, proposed by Charles Darwin, explains how species change over generations. Dinosaurs went extinct ~65 million years ago. Modern humans (Homo sapiens) appeared ~300,000 years ago.' },
  { keywords: ['black', 'hole', 'galaxy', 'star', 'universe', 'space'], answer: 'The universe is ~13.8 billion years old, expanding since the Big Bang. Black holes are regions where gravity is so strong nothing escapes. The Milky Way is our galaxy, containing 100-400 billion stars.' },
  { keywords: ['climate', 'change', 'global', 'warming', 'environment', 'carbon'], answer: 'Climate change refers to long-term shifts in temperatures and weather patterns, primarily driven by human activities like burning fossil fuels. CO₂ levels have risen from ~280 ppm (pre-industrial) to over 420 ppm today.' },
  { keywords: ['human', 'body', 'brain', 'heart', 'dna', 'cell', 'health'], answer: 'The human body has ~37 trillion cells. DNA contains the genetic code, with about 20,000 genes. The brain has ~86 billion neurons. The heart beats ~100,000 times per day, pumping 2,000 gallons of blood.' },
  { keywords: ['history', 'ancient', 'war', 'king', 'queen', 'empire', 'civilization'], answer: 'Human civilization began ~10,000 years ago with agriculture. Major ancient civilizations: Mesopotamia, Egypt, Indus Valley, China, Greece, Rome. The Roman Empire fell in 476 AD, marking the start of the Middle Ages.' },
  { keywords: ['philosophy', 'ethics', 'logic', 'reason', 'existence', 'knowledge'], answer: 'Philosophy explores fundamental questions about existence, knowledge, and ethics. Major branches: metaphysics (reality), epistemology (knowledge), ethics (right/wrong), logic (reasoning). Key figures: Socrates, Plato, Aristotle, Kant, Nietzsche.' },
  { keywords: ['psychology', 'mind', 'behavior', 'cognition', 'emotion', 'mental'], answer: 'Psychology studies the mind and behavior. Major approaches: behavioral (observable actions), cognitive (mental processes), psychoanalytic (unconscious mind), humanistic (self-actualization).' },
  { keywords: ['space', 'exploration', 'nasa', 'rocket', 'astronaut', 'moon', 'mars'], answer: 'Space exploration began in 1957 with Sputnik. The Apollo program landed humans on the Moon in 1969. The ISS has hosted astronauts continuously since 2000. Mars rovers (Perseverance, Curiosity) explore the Red Planet.' },
  { keywords: ['internet', 'web', 'network', 'tcp', 'ip', 'protocol', 'dns'], answer: 'The internet is a global network of computers communicating via TCP/IP. The World Wide Web (WWW) was invented by Tim Berners-Lee in 1989. DNS translates domain names to IP addresses.' },
  { keywords: ['computer', 'hardware', 'cpu', 'gpu', 'memory', 'ram', 'processor'], answer: 'A computer\'s CPU (Central Processing Unit) executes instructions. GPU (Graphics Processing Unit) handles parallel tasks like rendering and AI. RAM provides fast temporary storage. SSDs store data persistently.' },
  { keywords: ['quantum', 'computing', 'qubit', 'superposition', 'entanglement'], answer: 'Quantum computing uses quantum bits (qubits) that can exist in superposition (0 and 1 simultaneously). Entanglement links qubits so measuring one affects another instantly. It promises exponential speedup for certain problems.' },
  { keywords: ['sport', 'football', 'soccer', 'basketball', 'olympic', 'game'], answer: 'The most popular sports worldwide include soccer (football), basketball, cricket, tennis, and athletics. The Olympics, held every 4 years, feature summer and winter games with athletes from ~200 nations.' },
  { keywords: ['music', 'instrument', 'song', 'genre', 'rock', 'jazz', 'classical', 'pop'], answer: 'Music is organized sound using melody, harmony, rhythm, and timbre. Major genres: classical, jazz, rock, pop, hip-hop, electronic, folk. The piano, guitar, violin, and drums are among the most popular instruments.' },
  { keywords: ['economy', 'market', 'stock', 'trade', 'inflation', 'finance', 'money'], answer: 'Economics studies production, consumption, and transfer of wealth. Stock markets (NYSE, NASDAQ) let investors trade company shares. Inflation measures rising prices over time. Central banks adjust interest rates to manage the economy.' },
  { keywords: ['hello', 'hi', 'hey', 'greeting', 'sup', 'yo', 'howdy'], answer: 'Hello! I\'m an AI assistant here to help with any questions — about AutoMend, technology, programming, science, or anything else. What\'s on your mind?' },
  { keywords: ['how', 'are', 'you', 'doing'], answer: 'I\'m doing great, thanks for asking! I\'m here to help answer your questions — whether about AutoMend, tech, programming, or just about anything. What would you like to know?' },
  { keywords: ['thanks', 'thank', 'ty', 'thx', 'appreciate', 'grateful'], answer: 'You\'re very welcome! Happy to help. If you have more questions, just ask. I\'m here whenever you need me.' },
  { keywords: ['bye', 'goodbye', 'see', 'later', 'farewell', 'cya'], answer: 'Goodbye! Feel free to come back anytime you have questions. Have a great day!' },
  { keywords: ['joke', 'funny', 'humor', 'lol', 'laugh', 'ha'], answer: 'Here\'s one: Why do programmers prefer dark mode? Because light attracts bugs! 😄 Want another one or do you have a real question?' },
  { keywords: ['meaning', 'of', 'life', '42', 'everything', 'purpose'], answer: 'The answer to the ultimate question of life, the universe, and everything is 42 — according to Douglas Adams\' "The Hitchhiker\'s Guide to the Galaxy". Philosophically, it\'s a question each of us answers for ourselves.' },
  { keywords: ['what', 'is', 'your', 'name', 'who', 'are', 'you'], answer: 'I\'m the AutoMend Assistant! I\'m an AI chatbot built to answer questions about the AutoMend project, but I can also help with general tech, programming, science, and knowledge questions. What would you like to know?' },
  { keywords: ['what', 'can', 'you', 'do', 'help', 'capabilities'], answer: 'I can answer questions about AutoMend (the autonomous AI ops agent), help with programming and tech topics, explain scientific concepts, chat about general knowledge, and more. Just ask me anything!' },
  { keywords: ['who', 'made', 'created', 'built', 'you', 'developer'], answer: 'I was built as part of the AutoMend project by kenGucci. I\'m designed to help visitors learn about AutoMend and answer general questions. AutoMend itself is an open-source AI ops agent for autonomous system maintenance.' },
  { keywords: ['math', 'calculate', 'equation', 'algebra', 'geometry', 'calculus'], answer: 'I can help with math concepts! Key areas: Algebra (equations, variables), Geometry (shapes, angles), Calculus (derivatives, integrals), Statistics (mean, median, probability). What specific math question do you have?' },
  { keywords: ['physics', 'force', 'energy', 'motion', 'gravity', 'quantum'], answer: 'Physics studies matter, energy, and their interactions. Key concepts: Newton\'s laws of motion, thermodynamics, electromagnetism, relativity (E=mc²), quantum mechanics. What physics topic interests you?' },
  { keywords: ['write', 'code', 'program', 'function', 'script', 'snippet'], answer: 'I can help write and explain code. Just tell me what language and what you need — a function, algorithm, bug fix, or full program. For example: "Write a Python function to sort a list of dictionaries by a key."' },
  { keywords: ['debug', 'error', 'bug', 'fix', 'broken', 'issue'], answer: 'To help debug, I need: 1) The error message, 2) The relevant code, 3) What you expected to happen. Share those and I\'ll help identify the issue. Common bugs: typos, null references, off-by-one errors, async issues.' },
  { keywords: ['learn', 'study', 'resource', 'course', 'tutorial', 'beginner', 'start'], answer: 'Great resources for learning: freeCodeCamp, The Odin Project, Codecademy, MIT OpenCourseWare, and Khan Academy. For programming, pick one language (Python is great for beginners), build projects, and read others\' code.' },
  { keywords: ['automend', 'project', 'about'], answer: 'AutoMend is an autonomous AI agent that monitors, diagnoses, and remediates system issues — disk cleanup, log rotation, threshold alerts — with controlled autonomy. It sits on top of your existing monitoring stack (PagerDuty, Grafana, Datadog) and closes the gap between alert and resolution.' },
  { keywords: ['how', 'automend', 'work'], answer: 'AutoMend collects system metrics (CPU, memory, disk, network) every 30 seconds. When thresholds are crossed, the Diagnostic Engine analyzes root causes and recommends fixes. The Remediation Engine executes them with configurable safety — auto-approve, require approval, or dry-run mode. It then sends you a full report.' },
  { keywords: ['automend', 'safe', 'safety'], answer: 'Yes, safety is built-in at every level. Destructive actions require approval by default. There\'s a read-only mode (AUTO_REMEDIATION=false), dry-run sandboxing, an audit trail with timestamps, and rollback capability with state snapshots. You control the safety boundaries.' },
  { keywords: ['automend', 'install', 'install', 'setup'], answer: 'Quick start: git clone the repo, run "npm install && npm start" for the agent, then "pip install flask gunicorn && python3 dashboard/app.py" for the dashboard. You can also use Docker Compose. Full docs at https://github.com/kenGucci/automatic-maintenance.' },
  { keywords: ['automend', 'tech', 'stack'], answer: 'Built with Node.js 20 for the agent runtime, Python 3.11 + Flask for the dashboard, Chart.js for real-time charts, CrewAI for multi-agent orchestration (optional), Docker for containerization, and deployed on Vercel.' },
  { keywords: ['automend', 'free', 'price', 'cost'], answer: 'AutoMend is completely free and open source under the ISC license. You can use, modify, and distribute it freely. There are no paid tiers or hidden costs.' },
  { keywords: ['automend', 'feature'], answer: 'Key features: automated monitoring (CPU, memory, disk, network every 30s), intelligent diagnostics with root cause analysis, auto-remediation (log rotation, disk cleanup, cache flushing), configurable safety boundaries, real-time dashboard with Chart.js, REST API, audit trail, rollback support, and optional multi-agent AI orchestration via CrewAI.' },
  { keywords: ['automend', 'dashboard'], answer: 'The dashboard runs on Flask and provides real-time system metrics, health scores, alert history, diagnostic reports, and action logs. Available at http://localhost:8080 locally or at https://automatic-maintenance.vercel.app/dashboard.' },
  { keywords: ['automend', 'log', 'rotation', 'cleanup'], answer: 'AutoMend automatically rotates logs, truncates old access logs, prunes Docker build cache, and cleans temp files. When disk hits threshold, it identifies the largest offenders and resolves the issue automatically.' },
  { keywords: ['automend', 'demo', 'video'], answer: 'Scroll up to the Demo Video section on this page! There\'s a full walkthrough showing the dashboard, monitoring, diagnostics, and the AI-powered chat interface in under 2 minutes.' },
  { keywords: ['automend', 'github', 'contribute'], answer: 'The project is open source at https://github.com/kenGucci/automatic-maintenance. Contributions are welcome — bug reports, feature requests, docs, and PRs. Star the repo to show support!' },
  { keywords: ['automend', 'alert', 'threshold'], answer: 'Default thresholds: CPU — warning 70% / critical 90% | Memory — warning 75% / critical 95% | Disk — warning 80% / critical 95%. All thresholds are configurable via environment variables or the dashboard.' },
  { keywords: ['automend', 'docker'], answer: 'Yes! AutoMend has full Docker support. Use "docker compose up -d" to start both the agent and dashboard. The Docker setup uses tini as an init process for proper signal handling.' }
];

function scoreMatch(query, keywords) {
  const words = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  let score = 0;
  for (const kw of keywords) {
    const kwWords = kw.split(/\s+/);
    const matchCount = kwWords.filter(k => words.some(w => w === k || w.includes(k) || k.includes(w))).length;
    if (matchCount > 0) score += matchCount / kwWords.length;
  }
  return score;
}

function localAnswer(query) {
  const q = query.trim();
  if (!q) return "Please type a question!";

  let bestScore = 0;
  let best = null;
  for (const entry of GENERAL_KB) {
    const s = scoreMatch(q, entry.keywords);
    if (s > bestScore) { bestScore = s; best = entry; }
  }

  if (best && bestScore > 0.3) return best.answer;

  { keywords: ['bankr', 'crypto', 'portfolio', 'wallet', 'treasury', 'balance', 'token', 'trade'], answer: 'AutoMend now integrates with Bankr — an AI-powered crypto trading agent. The Crypto Treasury panel in the dashboard shows your multi-chain portfolio, balances, PnL, and lets you search token prices. It uses the Bankr API (bankr.bot) for all data.' },
  { keywords: ['bankr', 'what', 'is'], answer: 'Bankr is an AI-powered crypto trading and wallet agent. It supports Base, Ethereum, Polygon, Solana, and more. You can trade, swap, bridge, DCA, leverage trade, deploy tokens, and manage NFTs — all via natural language or API. AutoMend integrates it into the dashboard as a Crypto Treasury panel.' },
  { keywords: ['bankr', 'setup', 'api', 'key', 'configure'], answer: 'To connect Bankr to AutoMend: add your Bankr API key to .env as BANKR_API_KEY=bk_usr_.... Then the Crypto Treasury panel in the dashboard will show your portfolio, balances, and token data automatically.' },
  { keywords: ['bankr', 'trade', 'buy', 'sell', 'swap', 'dca'], answer: 'Bankr supports natural language trading: "Buy $100 of ETH on Base", "Swap 0.1 ETH for USDC", "DCA $50 into SOL every week", "Long BTC with 10x on Hyperliquid". It handles swaps, bridges, limit orders, stop losses, and more.' },

  const fallbacks = [
    "I'm not sure I understand. I can answer questions about AutoMend, crypto (via Bankr), programming, technology, science, and general knowledge. Try rephrasing your question.",
    "Hmm, I don't have an answer for that. Ask me about AutoMend, Bankr crypto, tech, programming, science, or just about anything else!",
    "I couldn't find a match. Try asking: 'What is AutoMend?', 'How does Bankr work?', 'Tell me about Python', or 'Tell me a joke'."
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

async function autoMendChat(query) {
  const q = query.trim();
  if (!q) return { answer: 'Please type a question!', matched: false };

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.answer || data.response || data.reply) {
        return { answer: data.answer || data.response || data.reply, matched: true };
      }
    }
  } catch {}

  return { answer: localAnswer(q), matched: false };
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;
}

function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 1.0;
  const voices = speechSynthesis.getVoices();
  if (voices.length) utter.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
  speechSynthesis.speak(utter);
}
