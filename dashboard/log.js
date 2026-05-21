(() => {
	const MAX_LOGS = 200;
	const state = {
		entries: [],
		filter: "all",
		wired: false,
	};

	function pad(value) {
		return String(value).padStart(2, "0");
	}

	function formatTime(date = new Date()) {
		return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	function getAgentName(agentId) {
		const agent = (window.AGENTS || []).find((item) => item.id === agentId);
		if (agent) return agent.name;
		if (agentId === "memo") return "메모";
		return agentId || "system";
	}

	function getLogContainer() {
		return document.getElementById("log-entries");
	}

	function getMemoForm() {
		return document.querySelector(".memo-form");
	}

	function getFilterButtons() {
		return Array.from(document.querySelectorAll(".filter-btn"));
	}

	function normalizeLevel(level) {
		const value = String(level || "info").toLowerCase();
		return ["info", "warn", "error"].includes(value) ? value : "info";
	}

	function createLogEntry(log) {
		const entry = document.createElement("article");
		const level = normalizeLevel(log.level);
		entry.className = `log-entry log-${level}`;
		entry.dataset.level = level;

		const time = document.createElement("span");
		time.className = "log-time";
		time.textContent = log.time || formatTime();

		const agent = document.createElement("strong");
		agent.className = "log-agent";
		agent.textContent = getAgentName(log.agentId);

		const msg = document.createElement("span");
		msg.className = "log-message";
		msg.textContent = log.msg || "";

		entry.append(time, agent, msg);
		return entry;
	}

	function renderLogs() {
		const container = getLogContainer();
		if (!container) return;

		container.innerHTML = "";
		state.entries.forEach((log) => {
			const entry = createLogEntry(log);
			const visible =
				state.filter === "all" || entry.dataset.level === state.filter;
			entry.hidden = !visible;
			container.appendChild(entry);
		});
	}

	function updateFilterButtons(activeLevel) {
		getFilterButtons().forEach((button) => {
			const label = (button.textContent || "").trim().toLowerCase();
			const buttonLevel =
				button.dataset.level || (label === "전체" ? "all" : label);
			button.dataset.level = buttonLevel;
			button.classList.toggle("is-active", buttonLevel === activeLevel);
		});
	}

	function setLogFilter(level) {
		state.filter = String(level || "all").toLowerCase();
		if (!["all", "info", "warn", "error"].includes(state.filter)) {
			state.filter = "all";
		}
		updateFilterButtons(state.filter);
		renderLogs();
	}

	function appendLog(agentId, level, msg) {
		const log = {
			time: formatTime(),
			agentId: agentId || "system",
			level: normalizeLevel(level),
			msg: String(msg || ""),
		};

		state.entries.unshift(log);
		if (state.entries.length > MAX_LOGS) {
			state.entries.length = MAX_LOGS;
		}

		renderLogs();
		return log;
	}

	function initLog(initialLogs) {
		state.entries = Array.isArray(initialLogs)
			? initialLogs.slice(0, MAX_LOGS).map((log) => ({
					time: log.time || formatTime(),
					agentId: log.agentId || "system",
					level: normalizeLevel(log.level),
					msg: String(log.msg || ""),
				}))
			: [];

		if (!state.wired) {
			getFilterButtons().forEach((button) => {
				button.addEventListener("click", () => {
					setLogFilter(button.dataset.level || "all");
				});
			});

			const memoForm = getMemoForm();
			if (memoForm) {
				memoForm.addEventListener("submit", (event) => {
					event.preventDefault();
					const textarea = memoForm.querySelector("textarea");
					const value = textarea ? textarea.value.trim() : "";
					if (!value) return;
					appendLog("memo", "info", value);
					if (textarea) textarea.value = "";
				});
			}

			state.wired = true;
		}

		updateFilterButtons(state.filter);
		renderLogs();
	}

	window.initLog = initLog;
	window.appendLog = appendLog;
	window.setLogFilter = setLogFilter;

	if (document.readyState === "loading") {
		document.addEventListener(
			"DOMContentLoaded",
			() => initLog(window.LOGS || []),
			{ once: true },
		);
	} else {
		initLog(window.LOGS || []);
	}
})();
