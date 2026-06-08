"""Politica de compartilhamento explicito de arquivos do YAMI.

Regra 2: Nenhum arquivo deve ser enviado automaticamente.
O YAMI so pode compartilhar arquivos quando houver uma solicitacao
explicita do usuario.

Fluxo esperado:
  1. O usuario solicita o envio.
  2. O YAMI identifica os arquivos relevantes.
  3. O YAMI confirma o conteudo que sera enviado.
  4. O YAMI executa o compartilhamento.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)

FILE_SHARING_TOOLS = frozenset({
    "send_message",
    "wacli",
})

MEDIA_PREFIX_RE = re.compile(r'MEDIA:\s*\S+')

def involves_file_sharing(tool_name: str, args: dict[str, Any]) -> bool:
    if tool_name not in FILE_SHARING_TOOLS:
        return False
    if tool_name == "send_message":
        message = args.get("message", "")
        if isinstance(message, str) and MEDIA_PREFIX_RE.search(message):
            return True
    return False


def get_block_message(tool_name: str, args: dict[str, Any]) -> Optional[str]:
    """Retorna mensagem de bloqueio se a chamada violar a politica.

    Implementa a Regra 2: Nenhum arquivo deve ser enviado automaticamente.
    O YAMI so compartilha arquivos quando houver uma solicitacao explicita do usuario.
    
    Fluxo enforçado:
      1. Usuario solicita o envio
      2. YAMI identifica os arquivos relevantes
      3. YAMI confirma o conteudo que sera enviado (ask the user for explicit consent)
      4. YAMI executa o compartilhamento

    Returns:
        None se a operacao pode prosseguir.
        str com a mensagem de bloqueio se violar a politica.
    """
    if not involves_file_sharing(tool_name, args):
        return None

    return (
        "🔒 COMPARTILHAMENTO DE ARQUIVO BLOQUEADO - Regra 2 (Politica Explicita)\n\n"
        "O YAMI segue uma politica rigorosa: nenhum arquivo pode ser enviado automaticamente. "
        "Os arquivos so sao compartilhados quando ha uma solicitacao EXPLICITA do usuario.\n\n"
        "ACAO NECESSARIA:\n"
        "1. Pergunte ao usuario se ele deseja enviar o arquivo\n"
        "2. Liste CLARAMENTE: nome do arquivo + destinatario + conteudo resumido\n"
        "3. Aguarde confirmacao EXPLICITA do usuario\n"
        "4. Apos confirmacao, execute o compartilhamento\n\n"
        "IMPORTANTE: O acesso ao arquivo nao concede autorizacao para compartiha-lo. "
        "A decisao final deve sempre permanecer com o usuario."
    )
