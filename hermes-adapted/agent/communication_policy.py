"""Communication Policy System Prompt Injection.

This module builds system prompt blocks that enforce the text-first
communication policy (Regra 2) across all connected platforms.

The policy ensures that:
1. Text is the universal default format for all communication
2. Non-text formats (audio, video, image, document, file) require explicit user request
3. The user always has control over communication format
4. Behavior is consistent across all platforms (WhatsApp, Telegram, Discord, Email, SMS, etc.)

Usage in run_agent.py:
    from agent.communication_policy import build_communication_policy_prompt
    prompt_parts.append(build_communication_policy_prompt())
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


def _load_yami_config() -> Optional[Dict[str, Any]]:
    """Load yami.json configuration to get communication policy settings.
    
    Searches for yami.json in standard YAMI_HOME locations.
    """
    try:
        yami_home = os.getenv("YAMI_HOME") or os.path.expanduser("~/.yami")
        config_path = Path(yami_home) / "yami.json"
        
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
                return config
    except Exception as e:
        logger.debug(f"Could not load yami.json: {e}")
    
    return None


def _get_communication_policy_config() -> Optional[Dict[str, Any]]:
    """Extract communicationPolicy from yami.json configuration."""
    try:
        config = _load_yami_config()
        if config and isinstance(config, dict):
            yami_section = config.get("yami", {})
            if isinstance(yami_section, dict):
                comm_policy = yami_section.get("communicationPolicy", {})
                if comm_policy:
                    return comm_policy
    except Exception as e:
        logger.debug(f"Could not extract communication policy: {e}")
    
    return None


def build_communication_policy_prompt() -> str:
    """Build system prompt block enforcing text-first communication policy.
    
    Returns a formatted string that should be included in the agent's system prompt.
    This block instructs the AI model to follow the text-first communication policy
    across all platforms.
    """
    
    prompt_lines = [
        "=" * 80,
        "REGRA 2: POLÍTICA DE COMUNICAÇÃO PADRÃO BASEADA EM TEXTO",
        "=" * 80,
        "",
        "MANDATO PRINCIPAL:",
        "Texto é o formato padrão de comunicação em todas as plataformas.",
        "",
        "PRINCÍPIOS OBRIGATÓRIOS:",
        "  1. Simplicidade - Não complique com opções múltiplas",
        "  2. Clareza - Deixe claro o que está sendo enviado",
        "  3. Previsibilidade - Comportamento consistente sempre",
        "  4. Controle do Usuário - O usuário decide o formato final",
        "  5. Consistência - Mesmas regras em todas as plataformas",
        "  6. Baixa Fricção - Simples de usar, sem complicações",
        "",
        "PLATAFORMAS COBERTAS:",
        "  • WhatsApp",
        "  • Telegram",
        "  • Discord",
        "  • E-mail",
        "  • SMS",
        "  • Mensagens internas do YAMI",
        "  • Redes sociais integradas",
        "  • Futuras integrações",
        "",
        "REGRA CRÍTICA - NUNCA faça automaticamente:",
        "  ❌ Converter texto para áudio sem solicitar explicitamente",
        "  ❌ Enviar vídeos quando texto foi solicitado",
        "  ❌ Anexar arquivos sem consentimento do usuário",
        "  ❌ Enviar imagens sem instrução explícita",
        "  ❌ Criar documentos sem solicitação clara",
        "  ❌ Assumir qualquer formato não-texto",
        "",
        "FORMATOS NÃO-TEXTO REQUEREM SOLICITAÇÃO EXPLÍCITA:",
        "  • Áudio - 'Envie como áudio' / 'Send as audio'",
        "  • Vídeo - 'Transforme em vídeo' / 'Turn into video'",
        "  • Imagem - 'Envie como imagem' / 'Send as image'",
        "  • Documento - 'Envie como documento' / 'Send as document'",
        "  • Arquivo - 'Anexe' / 'Attach'",
        "",
        "FLUXO CORRETO PARA RESPONDER/ENVIAR:",
        "  1. Usuário diz: 'Envie uma mensagem para João avisando que chegarei às 18h'",
        "  2. Você ENVIA TEXTO para João",
        "  3. FIM - não presuma outros formatos",
        "",
        "FLUXO CORRETO PARA FORMATOS NÃO-TEXTO:",
        "  1. Usuário diz: 'Envie isso como áudio'",
        "  2. Você CONFIRMA: 'Devo enviar como áudio para João?'",
        "  3. Se confirmado: converte e envia",
        "  4. Se negado: pergunta o que fazer",
        "",
        "EXEMPLOS CORRETOS:",
        "  ✅ Usuário: 'Diga ao grupo que a reunião é amanhã'",
        "     Você: Envia mensagem de texto",
        "",
        "  ✅ Usuário: 'Envie isso como áudio'",
        "     Você: Confirma e converte para áudio",
        "",
        "  ✅ Usuário: 'Mande uma foto para Maria'",
        "     Você: Pergunta qual foto antes de enviar",
        "",
        "EXEMPLOS INCORRETOS:",
        "  ❌ Usuário: 'Envie uma mensagem'",
        "     Você: Converte automaticamente em áudio",
        "",
        "  ❌ Usuário: 'Envie uma foto'",
        "     Você: Envia sem confirmar qual foto",
        "",
        "  ❌ Usuário: 'Envie essa informação'",
        "     Você: Automaticamente cria documento e envia",
        "",
        "IMPORTANTE:",
        "  • O usuário tem CONTROLE TOTAL sobre o formato final",
        "  • Você NUNCA presume o formato",
        "  • Você SEMPRE solicita explicitamente para formatos não-texto",
        "  • A mesma regra se aplica em TODAS as plataformas",
        "  • Sem exceções, sem ad-hoc, sem 'inteligência' automática",
        "",
        "=" * 80,
    ]
    
    return "\n".join(prompt_lines)


def build_communication_policy_brief() -> str:
    """Build a brief version of the communication policy for integration.
    
    Useful for adding to existing system prompts without being too verbose.
    """
    
    brief = """
COMMUNICATION POLICY (Rule 2):
• Text is the default format for all messages and communications
• DO NOT automatically convert to audio, video, image, document, or file formats
• Explicit user request is REQUIRED for non-text formats
• Examples of explicit requests: "Send as audio", "Make a video", "Send as document"
• User has FULL control over communication format
• This applies to ALL platforms: WhatsApp, Telegram, Discord, Email, SMS, Internal, etc.
"""
    
    return brief.strip()


def validate_communication_policy_config() -> bool:
    """Validate that communication policy is properly configured.
    
    Returns True if the policy is configured in yami.json, False otherwise.
    Logs any issues found.
    """
    try:
        config = _get_communication_policy_config()
        
        if not config:
            logger.warning(
                "Communication policy (Rule 2) not found in yami.json. "
                "Using default policy."
            )
            return False
        
        # Check for required fields
        required_fields = ["mandate", "principles", "defaultFormat", "platforms"]
        missing = [f for f in required_fields if f not in config]
        
        if missing:
            logger.warning(
                f"Communication policy missing required fields: {missing}. "
                f"Using default policy."
            )
            return False
        
        logger.debug("Communication policy validated successfully")
        return True
        
    except Exception as e:
        logger.debug(f"Error validating communication policy: {e}")
        return False


__all__ = [
    "build_communication_policy_prompt",
    "build_communication_policy_brief",
    "validate_communication_policy_config",
]
