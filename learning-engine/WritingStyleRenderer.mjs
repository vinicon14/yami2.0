export class WritingStyleRenderer {
  constructor(styleStore) {
    this.store = styleStore;
  }

  buildPromptInjection() {
    if (!this.store.enabled) return "";
    const block = this.store.getStylePromptBlock();
    if (!block) return "";

    return `
Instruções de Estilo de Escrita:
${block}

Quando responder mensagens, criar e-mails, redigir textos ou produzir conteúdo em nome do usuário, adapte sua resposta para refletir este perfil de estilo pessoal. Mantenha coerência com as características aprendidas enquanto preserva autenticidade e clareza.
`;
  }

  buildStyleInstructions(purpose = "general") {
    if (!this.store.enabled) return "";
    const summary = this.store.getStyleSummary();
    if (!summary.formality && !summary.tone && !summary.topGreeting) return "";

    const instructions = [];
    instructions.push("ESTILO DE COMUNICAÇÃO DO USUÁRIO:");

    if (summary.formality) {
      const formal = summary.formality.value === "formal" ? "formal e profissional" : "casual e descontraído";
      instructions.push(`- Tom geral: ${formal}`);
    }

    if (summary.tone) {
      instructions.push(`- Tom emocional predominante: ${this._describeTone(summary.tone.value)}`);
    }

    if (summary.vocabularyLevel) {
      instructions.push(`- Nível de vocabulário: ${summary.vocabularyLevel.value}`);
    }

    if (summary.sentenceStructure) {
      const structure = summary.sentenceStructure.value === "complex"
        ? "complexa com múltiplas cláusulas"
        : summary.sentenceStructure.value === "moderate"
        ? "moderadamente estruturada"
        : "simples e direta";
      instructions.push(`- Estrutura de frases: ${structure}`);
    }

    if (summary.avgMessageLength && summary.avgMessageLength > 0) {
      const length = summary.avgMessageLength > 200 ? "longas" : summary.avgMessageLength > 100 ? "médias" : "breves";
      instructions.push(`- Comprimento típico de mensagens: ${length} (média ${summary.avgMessageLength} caracteres)`);
    }

    if (summary.topGreeting) {
      instructions.push(`- Forma típica de cumprimento: "${summary.topGreeting}"`);
    }

    if (summary.topSignoff) {
      instructions.push(`- Forma típica de encerramento: "${summary.topSignoff}"`);
    }

    if (summary.emojiFrequency && summary.emojiFrequency > 0) {
      instructions.push(`- Uso de emojis: ${summary.emojiFrequency.toFixed(2)} por mensagem`);
    }

    if (summary.topExpressions && summary.topExpressions.length > 0) {
      instructions.push(`- Expressões recorrentes: ${summary.topExpressions.slice(0, 3).join(", ")}`);
    }

    if (summary.confidence >= 0.4) {
      instructions.push(`\n✓ Perfil de estilo estabelecido com ${Math.round(summary.confidence * 100)}% de confiança`);
    } else {
      instructions.push(`\nℹ Perfil de estilo em desenvolvimento (${summary.totalMessages} mensagens analisadas)`);
    }

    return instructions.join("\n");
  }

  buildResponseStyle(userMessage = "") {
    if (!this.store.enabled) return null;

    const summary = this.store.getStyleSummary();
    const style = {
      formality: summary.formality?.value || "neutral",
      tone: summary.tone?.value || "neutral",
      targetLength: this._estimateTargetLength(summary),
      useGreeting: summary.topGreeting ? true : false,
      greeting: summary.topGreeting || null,
      useSignoff: summary.topSignoff ? true : false,
      signoff: summary.topSignoff || null,
      emojiFrequency: summary.emojiFrequency || 0,
      vocabulary: summary.vocabularyLevel?.value || "simple",
      structure: summary.sentenceStructure?.value || "simple",
      confidence: summary.confidence,
    };

    if (userMessage && userMessage.length > 0) {
      const messageLength = userMessage.length;
      const wordCount = userMessage.split(/\s+/).length;
      style.matchUserLength = messageLength > 500;
      style.estimatedWords = wordCount;
    }

    return style;
  }

  formatMessageWithStyle(message, style = null) {
    if (!style) {
      style = this.buildResponseStyle();
    }
    if (!style) return message;

    let result = message;

    if (style.useGreeting && !result.match(/^(oi|olá|hey|opa|e aí)\b/i)) {
      const greeting = style.greeting ? `${style.greeting}, ` : "";
      result = greeting + result;
    }

    if (style.useSignoff && !result.match(/(abraços|beijos|vlw|flw|até|tchau)\b/i)) {
      result = result.trim() + "\n" + (style.signoff || "Abraços");
    }

    return result;
  }

  getAdaptationHints() {
    if (!this.store.enabled) return [];

    const summary = this.store.getStyleSummary();
    const hints = [];

    if (summary.confidence < 0.3) {
      hints.push({
        type: "low_confidence",
        message: "Estilo ainda em aprendizado - continue interagindo para melhor adaptação",
        priority: "info"
      });
    }

    if (summary.confidence >= 0.5 && summary.totalMessages < 10) {
      hints.push({
        type: "emerging_pattern",
        message: "Padrão de estilo começando a emergir",
        priority: "info"
      });
    }

    if (summary.confidence >= 0.7) {
      hints.push({
        type: "established_style",
        message: "Estilo bem estabelecido",
        priority: "success"
      });
    }

    if (summary.topGreeting && summary.topGreeting.length < 5) {
      hints.push({
        type: "brief_greeting",
        message: `Você geralmente cumprimenta com: "${summary.topGreeting}"`,
        priority: "info"
      });
    }

    if (summary.emojiFrequency && summary.emojiFrequency > 0.5) {
      hints.push({
        type: "emoji_user",
        message: "Você usa frequentemente emojis em suas mensagens",
        priority: "info"
      });
    }

    return hints;
  }

  _describeTone(tone) {
    const toneDescriptions = {
      positive: "otimista, entusiasmado",
      negative: "crítico, insatisfeito",
      neutral: "imparcial, informativo",
      enthusiastic: "animado, cheio de energia",
      sad: "reflexivo, melancólico"
    };
    return toneDescriptions[tone] || tone;
  }

  _estimateTargetLength(summary) {
    if (!summary.avgMessageLength) return "medium";
    if (summary.avgMessageLength > 300) return "long";
    if (summary.avgMessageLength > 150) return "medium";
    return "short";
  }
}
