export class SuggestionEngine {
  constructor(profileStore, habitTracker, contextAnalyzer) {
    this.store = profileStore;
    this.habits = habitTracker;
    this.context = contextAnalyzer;
  }

  generateSuggestions(request = "") {
    const context = this.context.analyzeCurrentContext(request);
    const suggestions = [];

    this._suggestDefaultFormat(suggestions, context, request);
    this._suggestWorkflow(suggestions, context);
    this._suggestRoutineAction(suggestions, context);
    this._suggestFrequentCommand(suggestions, context, request);
    this._suggestTool(suggestions, context);
    this._suggestFollowUp(suggestions, context);
    this._suggestEfficiency(suggestions, context);

    suggestions.sort((a, b) => b.priority - a.priority);
    return suggestions.slice(0, 5);
  }

  generateContextSummary(request = "") {
    const context = this.context.analyzeCurrentContext(request);
    const habits = this.habits.getUsageSummary();

    const summary = {};

    if (habits.currentRoutine) {
      summary.currentPeriod = habits.currentRoutine.period;
      summary.typicalActions = habits.currentRoutine.commonActions;
    }

    if (habits.preferences && Object.keys(habits.preferences).length > 0) {
      summary.learnedPreferences = habits.preferences;
    }

    if (context.contextChanged) {
      summary.contextChange = {
        from: context.previousFormat,
        to: context.newFormat,
      };
    }

    if (context.isRecurring) {
      summary.isRecurringTask = true;
      if (context.matchingWorkflow) {
        summary.matchingWorkflow = context.matchingWorkflow.name;
      }
    }

    if (context.detectedIntent) {
      summary.detectedIntent = context.detectedIntent;
    }

    return summary;
  }

  generateProfileSummary() {
    const profile = this.store.getProfile();
    const habits = this.habits.getUsageSummary();
    const sections = [];

    if (Object.keys(habits.preferences).length > 0) {
      const prefLines = Object.entries(habits.preferences).map(
        ([k, v]) => `${k}: ${v.value} (confiança: ${Math.round(v.confidence * 100)}%)`
      );
      sections.push({ heading: "Preferências Aprendidas", items: prefLines });
    }

    if (habits.frequentCommands.length > 0) {
      sections.push({
        heading: "Comandos Frequentes",
        items: habits.frequentCommands.slice(0, 5).map((c) => `${c.command} (${c.frequency}x)`),
      });
    }

    if (habits.frequentTools.length > 0) {
      sections.push({
        heading: "Ferramentas Frequentes",
        items: habits.frequentTools.slice(0, 5).map((t) => `${t.tool} (${t.frequency}x)`),
      });
    }

    if (habits.peakUsageHours.length > 0) {
      sections.push({
        heading: "Horários de Pico",
        items: habits.peakUsageHours.map((h) => `${h.hour} (${h.count} interações)`),
      });
    }

    if (habits.activeWorkflows.length > 0) {
      sections.push({
        heading: "Fluxos de Trabalho Identificados",
        items: habits.activeWorkflows.slice(0, 3).map(
          (w) => `${w.name} (${w.frequency}x, último: ${new Date(w.lastUsed).toLocaleDateString("pt-BR")})`
        ),
      });
    }

    return sections;
  }

  _suggestDefaultFormat(suggestions, context, request) {
    const defaultFormat = this.context.shouldSuggestDefaultFormat(request);
    if (defaultFormat && !context.contextChanged) {
      suggestions.push({
        type: "default_format",
        text: `Formatar como ${defaultFormat.toUpperCase()} (formato mais usado)`,
        priority: 0.8,
        confidence: this.store.getProfile().preferences.outputFormat?.confidence || 0.5,
      });
    }
  }

  _suggestWorkflow(suggestions, context) {
    if (context.matchingWorkflow) {
      const wf = context.matchingWorkflow;
      suggestions.push({
        type: "workflow",
        text: `Executar fluxo "${wf.name}" (${wf.frequency}x realizado antes)`,
        steps: wf.steps,
        priority: 0.9,
        confidence: Math.min(1, wf.frequency / 10),
      });
    }
  }

  _suggestRoutineAction(suggestions, context) {
    const routine = this.habits.getCurrentPeriodRoutine();
    if (routine && routine.commonActions.length > 0) {
      const firstAction = routine.commonActions[0];
      if (firstAction && firstAction.length > 5) {
        suggestions.push({
          type: "routine",
          text: `Baseado na sua rotina ${routine.period}, você costuma: ${firstAction}`,
          priority: 0.6,
          confidence: Math.min(1, routine.frequency / 15),
        });
      }
    }
  }

  _suggestFrequentCommand(suggestions, context, request) {
    if (!request || request.trim().length < 3) {
      const top = this.habits.getTopCommands(3);
      if (top.length > 0 && top[0].frequency > 1) {
        suggestions.push({
          type: "frequent_command",
          text: `Comando mais frequente: "${top[0].command}" (${top[0].frequency}x)`,
          priority: 0.5,
          confidence: Math.min(1, top[0].frequency / 20),
        });
      }
    }
  }

  _suggestTool(suggestions, context) {
    const topTools = this.habits.getTopTools(3);
    if (topTools.length > 0 && topTools[0].frequency > 2) {
      const now = Date.now();
      const lastUsed = new Date(topTools[0].lastUsed).getTime();
      const daysSinceLastUse = (now - lastUsed) / (1000 * 60 * 60 * 24);
      if (daysSinceLastUse < 7) {
        suggestions.push({
          type: "frequent_tool",
          text: `Ferramenta mais usada: ${topTools[0].tool} (${topTools[0].frequency}x)`,
          priority: 0.4,
          confidence: Math.min(1, topTools[0].frequency / 15),
        });
      }
    }
  }

  _suggestFollowUp(suggestions, context) {
    const interactions = this.store.interactions || [];
    if (interactions.length < 2) return;

    const lastInteraction = interactions[interactions.length - 1];
    if (!lastInteraction) return;
    const lastText = typeof lastInteraction.content === "string" ? lastInteraction.content : "";
    const recentMs = 5 * 60 * 1000;
    const timeSince = Date.now() - new Date(lastInteraction.timestamp).getTime();

    if (timeSince < recentMs && lastText.length > 5) {
      const routine = this.habits.getCurrentPeriodRoutine();
      if (routine && routine.frequency > 3) {
        const nextTypical = routine.commonActions[1];
        if (nextTypical && nextTypical !== lastText) {
          suggestions.push({
            type: "follow_up",
            text: `Após "${lastText.slice(0, 40)}...", você costuma: ${nextTypical}`,
            priority: 0.35,
            confidence: 0.4,
          });
        }
      }
    }
  }

  _suggestEfficiency(suggestions, context) {
    const workflows = this.habits.getIdentifiedWorkflows();
    if (workflows.length >= 2) {
      suggestions.push({
        type: "efficiency",
        text: `Você tem ${workflows.length} fluxos de trabalho recorrentes. Quer criar atalhos para eles?`,
        priority: 0.3,
        confidence: 0.6,
      });
    }
  }
}
