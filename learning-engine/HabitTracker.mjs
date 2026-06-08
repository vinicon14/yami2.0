export class HabitTracker {
  constructor(profileStore) {
    this.store = profileStore;
  }

  getPeakUsageHours() {
    const hours = this.store.getProfile().habits.activeHours;
    const entries = Object.entries(hours).sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 5).map(([hour, count]) => ({ hour, count }));
  }

  getTopCommands(limit = 10) {
    const cmds = this.store.getProfile().habits.frequentCommands || [];
    return cmds.slice(0, limit).map((c) => ({
      command: c.name,
      frequency: c.count,
      lastUsed: c.lastUsed,
    }));
  }

  getTopApps(limit = 5) {
    const apps = this.store.getProfile().habits.frequentApps || [];
    return apps.slice(0, limit).map((a) => ({
      app: a.name,
      frequency: a.count,
      lastUsed: a.lastUsed,
    }));
  }

  getTopSites(limit = 5) {
    const sites = this.store.getProfile().habits.frequentSites || [];
    return sites.slice(0, limit).map((s) => ({
      site: s.name,
      frequency: s.count,
      lastUsed: s.lastUsed,
    }));
  }

  getTopTools(limit = 10) {
    const tools = this.store.getProfile().habits.toolsUsed || {};
    return Object.entries(tools)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([name, data]) => ({
        tool: name,
        frequency: data.count,
        lastUsed: data.lastUsed,
      }));
  }

  getCurrentPeriodRoutine() {
    const hour = new Date().getHours();
    const routines = this.store.getProfile().routines;
    let period;
    if (hour >= 6 && hour < 12) period = "morning";
    else if (hour >= 12 && hour < 18) period = "afternoon";
    else if (hour >= 18 && hour < 24) period = "evening";
    else period = "night";

    const routine = routines[period];
    if (!routine || routine.frequency < 2) return null;

    return {
      period,
      timeRange: routine.timeRange,
      commonActions: routine.commonActions.slice(0, 5),
      frequency: routine.frequency,
    };
  }

  getIdentifiedWorkflows() {
    const workflows = this.store.getProfile().workflows || [];
    return workflows
      .filter((w) => w.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
      .map((w) => ({
        name: w.name,
        steps: w.steps,
        frequency: w.frequency,
        lastUsed: w.lastUsed,
      }));
  }

  getLearnedPreferences() {
    const prefs = this.store.getProfile().preferences || {};
    const meaningful = {};
    for (const [key, val] of Object.entries(prefs)) {
      if (val && val.confidence >= 0.3) {
        meaningful[key] = val;
      }
    }
    return meaningful;
  }

  getUsageSummary() {
    const profile = this.store.getProfile();
    const prefs = this.getLearnedPreferences();
    const topCmds = this.getTopCommands(5);
    const topTools = this.getTopTools(5);
    const routine = this.getCurrentPeriodRoutine();
    const peakHours = this.getPeakUsageHours();

    return {
      totalInteractions: profile.totalInteractions,
      preferences: prefs,
      frequentCommands: topCmds,
      frequentTools: topTools,
      currentRoutine: routine,
      peakUsageHours: peakHours,
      activeWorkflows: this.getIdentifiedWorkflows(),
      lastActive: profile.lastUpdated,
    };
  }
}
