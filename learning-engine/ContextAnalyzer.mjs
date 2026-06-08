export class ContextAnalyzer {
  constructor(profileStore) {
    this.store = profileStore;
  }

  analyzeCurrentContext(request) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    const requestLower = (request || "").toLowerCase();

    const context = {
      timestamp: now.toISOString(),
      hour: currentHour,
      dayOfWeek: currentDay,
      isWeekend: currentDay === 0 || currentDay === 6,
      period: this._getPeriod(currentHour),
      requestType: this._classifyRequest(requestLower),
      detectedIntent: this._detectIntent(requestLower),
      isRecurring: false,
      matchingWorkflow: null,
      preferenceHints: [],
      contextChanged: false,
    };

    this._checkRecurringPattern(context, requestLower);
    this._checkWorkflowMatch(context, requestLower);
    this._gatherPreferenceHints(context, requestLower);
    this._detectContextChange(context, requestLower);

    return context;
  }

  shouldSuggestDefaultFormat(request) {
    const context = this.analyzeCurrentContext(request);
    const prefs = this.store.getProfile().preferences;

    if (context.contextChanged) return null;
    if (context.requestType === "format_request") return null;

    const outputPref = prefs.outputFormat;
    if (outputPref && outputPref.confidence >= 0.4) {
      const hasFormat = /pdf|ppt|pptx|doc|docx|xlsx|csv|html|md|json|xml/i.test(request);
      const wantsOutput = /cri[ae]|ger[ae]|produz|mont[ae]|faça|faca|make|create|generat|produc/i.test(request);
      if (wantsOutput && !hasFormat) {
        return outputPref.value;
      }
    }

    return null;
  }

  shouldConfirmAction(request) {
    const context = this.analyzeCurrentContext(request);
    const requestLower = request.toLowerCase();

    const destructive = /apag[ae]|delet[ae]|remov[ae]|exclu[ei]|deslig|shutdown|restart|format|reset/i.test(requestLower);
    if (destructive) return "high";

    if (context.requestType === "unknown" && !context.isRecurring) return "medium";

    if (context.matchingWorkflow && context.matchingWorkflow.frequency > 5) return "low";

    if (context.isRecurring) return "low";

    return null;
  }

  getPreferenceConfidence(key, value) {
    const prefs = this.store.getProfile().preferences;
    const entry = prefs[key];
    if (!entry) return 0;
    if (entry.value !== value) return Math.max(0, 1 - entry.confidence);
    return entry.confidence;
  }

  isPreferenceEstablished(key, threshold = 0.4) {
    const prefs = this.store.getProfile().preferences;
    return prefs[key] && prefs[key].confidence >= threshold;
  }

  _getPeriod(hour) {
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 24) return "evening";
    return "night";
  }

  _classifyRequest(text) {
    if (/cri[ae]|criar|ger[ae]|produz|mont[ae]|crie|faça|faca|make|create|generat/i.test(text)) {
      return "creation";
    }
    if (/busc[ae]|procur[ae]|pesquis[ae]|encontr[ae]|search|find|look|fetch/i.test(text)) {
      return "search";
    }
    if (/abri[rt]|inici[ae]|execut[ae]|start|launch|open|run|play/i.test(text)) {
      return "action";
    }
    if (/expli[cç]|como|o que|what|how|why|explain|tell|meaning/i.test(text)) {
      return "question";
    }
    if (/resum[ei]|summariz|resumir|síntese|sinopse/i.test(text)) {
      return "summary";
    }
    if (/format[o]?|convert|traduz|tradutor/i.test(text)) {
      return "format_request";
    }
    if (/agend[ae]|lembr[ae]|schedule|remind|calendar|evento/i.test(text)) {
      return "scheduling";
    }
    return "unknown";
  }

  _detectIntent(text) {
    if (/pdf/i.test(text)) return "pdf";
    if (/apresenta[cç][aã]o|slides|ppt/i.test(text)) return "presentation";
    if (/planilha|spreadsheet|csv|xlsx/i.test(text)) return "spreadsheet";
    if (/relat[oó]rio|report/i.test(text)) return "report";
    if (/m[uú]sic[ae]|playlist|spotify|song/i.test(text)) return "music";
    if (/whatsapp|mensagem|message|send/i.test(text)) return "message";
    if (/e[-]?mail|email/i.test(text)) return "email";
    if (/c[oó]dig[o]|code|coding|programa[cç][aã]o/i.test(text)) return "code";
    if (/fot[o]|photo|image|imagem|picture/i.test(text)) return "image";
    return null;
  }

  _checkRecurringPattern(context, request) {
    const profile = this.store.getProfile();
    const interactions = this.store.interactions || [];
    if (interactions.length < 2) return;

    const recentSimilar = interactions
      .filter((i) => {
        const text = typeof i.content === "string" ? i.content.toLowerCase() : "";
        const words = request.split(/\s+/).filter((w) => w.length > 3);
        const matches = words.filter((w) => text.includes(w));
        return matches.length >= Math.min(2, words.length);
      })
      .slice(-10);

    if (recentSimilar.length >= 3) {
      context.isRecurring = true;
    }
  }

  _checkWorkflowMatch(context, request) {
    const workflows = this.store.getProfile().workflows || [];
    for (const wf of workflows) {
      const matchCount = wf.steps.filter((step) => {
        const stepLower = step.toLowerCase();
        const words = stepLower.split(/\s+/).filter((w) => w.length > 3);
        return words.filter((w) => request.includes(w)).length >= Math.min(2, words.length);
      }).length;

      if (matchCount >= Math.min(2, wf.steps.length)) {
        context.matchingWorkflow = wf;
        context.isRecurring = true;
        break;
      }
    }
  }

  _gatherPreferenceHints(context, request) {
    const prefs = this.store.getProfile().preferences;
    if (prefs.outputFormat && prefs.outputFormat.confidence >= 0.3) {
      if (/cri[ae]|ger[ae]|produz/i.test(request)) {
        context.preferenceHints.push({
          type: "outputFormat",
          value: prefs.outputFormat.value,
          confidence: prefs.outputFormat.confidence,
        });
      }
    }
    if (prefs.verbosity && prefs.verbosity.confidence >= 0.3) {
      context.preferenceHints.push({
        type: "verbosity",
        value: prefs.verbosity.value,
        confidence: prefs.verbosity.confidence,
      });
    }
  }

  _detectContextChange(context, request) {
    const profile = this.store.getProfile();
    const prefs = profile.preferences;

    if (prefs.outputFormat && prefs.outputFormat.confidence >= 0.3) {
      const usualFormat = prefs.outputFormat.value;
      const requestedFormat = this._detectFormat(request);
      if (requestedFormat && requestedFormat !== usualFormat) {
        context.contextChanged = true;
        context.previousFormat = usualFormat;
        context.newFormat = requestedFormat;
      }
    }
  }

  _detectFormat(text) {
    if (/pdf/i.test(text)) return "pdf";
    if (/apresenta[cç][aã]o|slides|ppt|pptx/i.test(text)) return "presentation";
    if (/planilha|spreadsheet|csv|xlsx/i.test(text)) return "spreadsheet";
    if (/documento|doc|docx|word/i.test(text)) return "document";
    if (/html|página|pagina|webpage|site/i.test(text)) return "html";
    return null;
  }
}
