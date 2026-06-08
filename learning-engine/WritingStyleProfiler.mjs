export class WritingStyleProfiler {
  constructor() {
    this.formalWords = new Set([
      "senhor", "senhora", "prezado", "prezada", "gentil", "favor", "solicitamos",
      "respeitosamente", "atenciosamente", "portanto", "além disso", "desse modo",
      "consequentemente", "furthermore", "nevertheless", "accordingly", "regarding"
    ]);

    this.informalWords = new Set([
      "vc", "você", "tá", "tô", "tava", "temos", "vamos", "opa", "oi", "eis",
      "pô", "cara", "mano", "gata", "galera", "pessoal", "ai", "aí",
      "yo", "gonna", "wanna", "gotta", "ain't", "y'all", "dude", "bro"
    ]);

    this.slangTerms = new Set([
      "vai", "bora", "tá bom", "blz", "blza", "tmj", "vlw", "flw", "falou",
      "tranquilo", "tranquilão", "maneiro", "bacana", "demais", "show",
      "top", "massa", "cabuloso", "e aí", "e ai"
    ]);

    this.emotionalWords = {
      positive: new Set([
        "amo", "adorei", "excelente", "perfeito", "maravilhoso", "ótimo", "melhor",
        "incrível", "fantástico", "sensacional", "legal", "show", "bacana",
        "wonderful", "amazing", "fantastic", "excellent", "love", "awesome"
      ]),
      negative: new Set([
        "odeio", "horrível", "péssimo", "terrível", "ruim", "chato", "decepcionante",
        "frustrado", "raiva", "bravo", "hate", "awful", "terrible", "disgusting"
      ]),
      neutral: new Set([
        "ok", "tudo bem", "normal", "regular", "médio", "neutro",
        "fine", "okay", "alright", "average", "decent"
      ]),
      enthusiastic: new Set([
        "eba", "ebaaa", "uau", "wow", "nossa", "caramba", "caralho", "excitado",
        "empolgado", "animado", "top demais", "show de bola",
        "awesome", "yay", "haha", "hehe", "woah"
      ]),
      sad: new Set([
        "triste", "infeliz", "deprimido", "sozinho", "saudade", "chorando",
        "sad", "unhappy", "lonely", "miss", "crying", "tears"
      ])
    };

    this.emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    this.urlRegex = /https?:\/\/[^\s]+/gi;
  }

  analyzeMessage(text) {
    const metrics = {};

    metrics.formalityLevel = this._detectFormality(text);
    metrics.vocabularyLevel = this._detectVocabularyLevel(text);
    metrics.sentenceStructure = this._analyzeSentenceStructure(text);
    metrics.tone = this._detectTone(text);
    metrics.emojiCount = this._countEmojis(text);
    metrics.wordCount = this._countWords(text);
    metrics.charCount = text.length;
    metrics.sentences = this._countSentences(text);
    metrics.slangScore = this._detectSlang(text);

    metrics.greetings = this._extractGreeting(text);
    metrics.signoffs = this._extractSignoff(text);
    metrics.expressions = this._extractExpressions(text);
    metrics.vocabulary = this._extractVocabulary(text);

    return metrics;
  }

  _detectFormality(text) {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);

    let formalCount = 0;
    let informalCount = 0;

    for (const word of words) {
      const cleaned = word.replace(/[^a-záàâãéèêíóôõúç]/gi, "");
      if (this.formalWords.has(cleaned)) formalCount++;
      if (this.informalWords.has(cleaned)) informalCount++;
    }

    const score = (formalCount - informalCount) / Math.max(1, formalCount + informalCount);

    if (formalCount + informalCount < 2) {
      if (/você|senhor|prezado|gentil/i.test(text)) return "formal";
      if (/vc|bro|dude|y'all|gonna|wanna/i.test(text)) return "casual";
      return "neutral";
    }

    if (score > 0.3) return "formal";
    if (score < -0.3) return "casual";
    return "neutral";
  }

  _detectVocabularyLevel(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const cleanWords = words.map(w => w.replace(/[^a-záàâãéèêíóôõúçA-Z0-9]/g, "").toLowerCase()).filter(w => w.length > 0);

    const uniqueWords = new Set(cleanWords);
    const avgWordLength = cleanWords.reduce((a, b) => a + b.length, 0) / Math.max(1, cleanWords.length);
    const complexityScore = (uniqueWords.size / cleanWords.length) * avgWordLength;

    if (complexityScore > 6) return "advanced";
    if (complexityScore > 4.5) return "intermediate";
    return "simple";
  }

  _analyzeSentenceStructure(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const wordsPerSentence = sentences.reduce((sum, s) => {
      return sum + s.trim().split(/\s+/).length;
    }, 0) / Math.max(1, sentences.length);

    const commaCount = (text.match(/,/g) || []).length;
    const complexityScore = (wordsPerSentence * commaCount) / sentences.length;

    if (wordsPerSentence > 20 || complexityScore > 10) return "complex";
    if (wordsPerSentence > 12) return "moderate";
    return "simple";
  }

  _detectTone(text) {
    const lower = text.toLowerCase();
    const tones = {};

    for (const [toneName, words] of Object.entries(this.emotionalWords)) {
      let count = 0;
      for (const word of words) {
        if (lower.includes(word)) count++;
      }
      if (count > 0) tones[toneName] = count;
    }

    if (Object.keys(tones).length === 0) return "neutral";

    const dominant = Object.entries(tones).sort((a, b) => b[1] - a[1])[0];
    return dominant ? dominant[0] : "neutral";
  }

  _countEmojis(text) {
    const matches = text.match(this.emojiRegex) || [];
    return matches.length;
  }

  _countWords(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  _countSentences(text) {
    const matches = text.match(/[.!?]+/g) || [];
    return Math.max(1, matches.length);
  }

  _detectSlang(text) {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);

    let slangCount = 0;
    for (const word of words) {
      const cleaned = word.replace(/[^a-záàâãéèêíóôõúç]/gi, "");
      if (this.slangTerms.has(cleaned)) slangCount++;
    }

    return slangCount / Math.max(1, words.length);
  }

  _extractGreeting(text) {
    const greetingPatterns = [
      /^(oi|olá|opa|hey|hi|hello|bonjour|buenos días|buenas tardes|boa noite|bom dia|boa tarde)\b/i,
      /^(e aí|e ai)\b/i,
      /^(como vai|como você está|cê tá bem|tudo bem)\b/i
    ];

    for (const pattern of greetingPatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  _extractSignoff(text) {
    const lines = text.split(/\n/);
    const lastLine = lines[lines.length - 1].toLowerCase().trim();

    const signoffPatterns = [
      /^(abraços|abraço|beijos|beijo|valeu|vlw|flw|até|até logo|tchau|adeus|cya|bye|regards|sincerely|atenciosamente|respeitosamente)\b/i,
      /^(um (grande )?abraço|um (grande )?beijo|tudo de bom|tudo bem|fica bem|bjs|abs)\b/i
    ];

    for (const pattern of signoffPatterns) {
      const match = lastLine.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  _extractExpressions(text) {
    const expressions = [];
    const phraseLengthLimit = 50;

    const commonPhrases = [
      /por favor/gi,
      /muito obrigado/gi,
      /sem problemas/gi,
      /tudo bem/gi,
      /fica bem/gi,
      /se você precisar/gi,
      /deixe-me saber/gi,
      /estou aqui para ajudar/gi,
      /com prazer/gi,
      /com certeza/gi,
      /claro que sim/gi,
      /é isso/gi,
      /tipo assim/gi,
      /sabe/gi,
      /na real/gi,
      /basicamente/gi,
      /no geral/gi
    ];

    for (const pattern of commonPhrases) {
      const matches = text.match(pattern) || [];
      if (matches.length > 0) {
        const phrase = matches[0].substring(0, phraseLengthLimit);
        const existing = expressions.find(e => e.text === phrase);
        if (existing) {
          existing.count += matches.length;
        } else {
          expressions.push({ text: phrase, type: "phrase", count: matches.length });
        }
      }
    }

    return expressions;
  }

  _extractVocabulary(text) {
    const words = text.split(/\s+/);
    const vocabulary = {};

    const stopwords = new Set([
      "o", "a", "e", "é", "de", "do", "da", "em", "um", "uma", "para", "por",
      "que", "com", "sem", "mais", "menos", "muito", "pouco", "como", "mas",
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "is", "are", "was", "were", "be", "been", "be", "have", "has", "had"
    ]);

    for (const word of words) {
      const cleaned = word.replace(/[^a-záàâãéèêíóôõúçA-Z0-9]/g, "").toLowerCase();
      if (cleaned.length > 2 && !stopwords.has(cleaned)) {
        vocabulary[cleaned] = (vocabulary[cleaned] || 0) + 1;
      }
    }

    return vocabulary;
  }
}
