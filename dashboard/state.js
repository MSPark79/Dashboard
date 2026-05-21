(() => {
	const dashboardState = { selectedAgentId: null };

	function setSelectedAgentId(agentId) {
		dashboardState.selectedAgentId =
			agentId === dashboardState.selectedAgentId ? null : agentId || null;
		if (typeof window.renderDashboard === "function") window.renderDashboard();
		return dashboardState.selectedAgentId;
	}

	function getSelectedAgentId() {
		return dashboardState.selectedAgentId;
	}

	function getVisibleTasks(tasks) {
		const list = Array.isArray(tasks) ? tasks : [];
		return dashboardState.selectedAgentId
			? list.filter((task) => task.agentId === dashboardState.selectedAgentId)
			: list.slice();
	}

	window.dashboardState = dashboardState;
	window.setSelectedAgentId = setSelectedAgentId;
	window.getSelectedAgentId = getSelectedAgentId;
	window.getVisibleTasks = getVisibleTasks;
})();
