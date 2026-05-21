(() => {
	const STATUS_ORDER = ["running", "idle", "error", "waiting"];
	const STRATEGY_STATE_KEY = "dashboard.strategyState";
	let cardsSelectionWired = false;

	function getByIdOrFallback(id, fallbackSelector) {
		return (
			document.getElementById(id) || document.querySelector(fallbackSelector)
		);
	}

	function ensureStatusCountElements() {
		const map = {
			running: getByIdOrFallback(
				"count-running",
				"#status-summary .running strong",
			),
			idle: getByIdOrFallback("count-idle", "#status-summary .idle strong"),
			error: getByIdOrFallback("count-error", "#status-summary .error strong"),
			waiting: getByIdOrFallback(
				"count-waiting",
				"#status-summary .waiting strong",
			),
		};

		Object.entries(map).forEach(([status, element]) => {
			if (element && !element.id) {
				element.id = `count-${status}`;
			}
		});

		return map;
	}

	function getAgentName(agentId) {
		const agent = (window.AGENTS || []).find((item) => item.id === agentId);
		return agent ? agent.name : agentId;
	}

	function badgeClassForModel(model) {
		if (model?.startsWith("anthropic/")) return "anthropic";
		if (model?.startsWith("google/")) return "google";
		return "openai";
	}

	function statusLabel(status) {
		const labels = {
			running: "진행",
			idle: "대기",
			error: "오류",
			waiting: "보류",
			pending: "대기",
			blocked: "차단",
			completed: "완료",
		};

		return labels[status] || status;
	}

	function priorityLabel(priority) {
		const labels = { high: "높음", medium: "중간", low: "낮음" };
		return labels[priority] || priority;
	}

	function readStrategyState() {
		try {
			const raw = window.localStorage?.getItem(STRATEGY_STATE_KEY);
			if (!raw) return {};
			const parsed = JSON.parse(raw);
			return parsed && typeof parsed === "object" ? parsed : {};
		} catch {
			return {};
		}
	}

	function writeStrategyState(nextState) {
		try {
			window.localStorage?.setItem(
				STRATEGY_STATE_KEY,
				JSON.stringify(nextState),
			);
		} catch {}
	}

	function mergeStrategyState(strategies) {
		const savedState = readStrategyState();
		return strategies.map((strategy) => ({
			...strategy,
			checked: Object.hasOwn(savedState, strategy.id)
				? Boolean(savedState[strategy.id])
				: Boolean(strategy.checked),
		}));
	}

	function collectStrategyState(fieldset) {
		const nextState = {};
		fieldset.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
			if (checkbox.id) {
				nextState[checkbox.id.replace(/^strategy-/, "")] = checkbox.checked;
			}
		});
		return nextState;
	}

	function renderAgentCards(agents) {
		const cards = document.getElementById("cards");
		if (!cards) return;

		const selectedAgentId =
			typeof window.getSelectedAgentId === "function"
				? window.getSelectedAgentId()
				: null;

		cards.innerHTML = "";

		agents.forEach((agent) => {
			const card = document.createElement("article");
			card.className = "agent-card";
			if (agent.id === selectedAgentId) {
				card.classList.add("is-selected");
			}
			card.dataset.status = agent.status;
			card.dataset.agentId = agent.id;

			const header = document.createElement("div");
			header.className = "agent-card-header";

			const titleWrap = document.createElement("div");
			const title = document.createElement("h4");
			title.textContent = agent.name;

			const statusRow = document.createElement("div");
			statusRow.className = "task-meta";

			const dot = document.createElement("span");
			dot.className = "status-dot";

			const status = document.createElement("span");
			status.className = "status-badge";
			status.textContent = statusLabel(agent.status);

			statusRow.append(dot, status);
			titleWrap.append(title, statusRow);

			const model = document.createElement("span");
			model.className = `model-badge ${badgeClassForModel(agent.model)}`;
			model.textContent = agent.model;

			header.append(titleWrap, model);

			const purpose = document.createElement("p");
			purpose.textContent = agent.purpose;

			const output = document.createElement("p");
			output.className = "agent-last-output";
			output.textContent = agent.lastOutput;

			card.append(header, purpose, output);
			cards.appendChild(card);
		});

		if (!cardsSelectionWired) {
			cards.addEventListener("click", (event) => {
				let target = event.target;
				while (target && target !== cards) {
					if (target.classList?.contains("agent-card")) {
						if (typeof window.setSelectedAgentId === "function") {
							window.setSelectedAgentId(target.dataset.agentId || null);
						}
						break;
					}
					target = target.parentNode;
				}
			});
			cardsSelectionWired = true;
		}
	}

	function renderTaskList(tasks) {
		const list = document.getElementById("task-list");
		if (!list) return;

		list.innerHTML = "";

		tasks.forEach((task) => {
			const item = document.createElement("li");
			item.className = "task-row";
			item.dataset.status = task.status;
			item.dataset.taskId = task.id;

			const left = document.createElement("div");

			const title = document.createElement("strong");
			title.textContent = task.title;

			const agent = document.createElement("div");
			agent.className = "task-meta";

			const agentLabel = document.createElement("span");
			agentLabel.textContent = `담당: ${getAgentName(task.agentId)}`;

			agent.appendChild(agentLabel);
			left.append(title, agent);

			const right = document.createElement("div");
			right.className = "task-meta";

			const priority = document.createElement("span");
			priority.className = `priority-badge ${task.priority}`;
			priority.textContent = priorityLabel(task.priority);

			const status = document.createElement("span");
			status.className = "status-badge";
			status.textContent = statusLabel(task.status);

			right.append(priority, status);
			item.append(left, right);
			list.appendChild(item);
		});
	}

	function renderChecklist(strategies) {
		const checklist = document.getElementById("checklist");
		if (!checklist) return;

		const mergedStrategies = mergeStrategyState(strategies || []);
		checklist.innerHTML = "";

		const fieldset = document.createElement("fieldset");
		const legend = document.createElement("legend");
		legend.textContent = "모델 전략 체크리스트";
		fieldset.appendChild(legend);

		mergedStrategies.forEach((strategy) => {
			const inputId = `strategy-${strategy.id}`;
			const label = document.createElement("label");
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.id = inputId;
			checkbox.name = strategy.id;
			checkbox.checked = Boolean(strategy.checked);
			label.htmlFor = inputId;

			const text = document.createElement("span");
			text.textContent = `${strategy.label} — ${strategy.desc}`;

			label.append(checkbox, text);
			fieldset.appendChild(label);
		});

		fieldset.addEventListener("change", () => {
			writeStrategyState(collectStrategyState(fieldset));
		});

		checklist.appendChild(fieldset);
	}

	function updateStatusSummary(agents) {
		const counts = agents.reduce(
			(acc, agent) => {
				if (STATUS_ORDER.includes(agent.status)) {
					acc[agent.status] += 1;
				}
				return acc;
			},
			{ running: 0, idle: 0, error: 0, waiting: 0 },
		);

		const nodes = ensureStatusCountElements();
		STATUS_ORDER.forEach((status) => {
			if (nodes[status]) {
				nodes[status].textContent = String(counts[status]);
			}
		});
	}

	function renderDashboard() {
		renderAgentCards(window.AGENTS || []);
		const visibleTasks =
			typeof window.getVisibleTasks === "function"
				? window.getVisibleTasks(window.TASKS || [])
				: window.TASKS || [];
		renderTaskList(visibleTasks);
		renderChecklist(window.STRATEGIES || []);
		updateStatusSummary(window.AGENTS || []);
	}

	window.renderAgentCards = renderAgentCards;
	window.renderTaskList = renderTaskList;
	window.renderChecklist = renderChecklist;
	window.renderDashboard = renderDashboard;

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", renderDashboard, {
			once: true,
		});
	} else {
		renderDashboard();
	}
})();
