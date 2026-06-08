#!/usr/bin/env python3
"""
YAMI — Assistente de IA Pessoal Visual e por Voz
Ponto de entrada principal da aplicação
"""

import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Função principal de inicialização"""
    logger.info("Iniciando YAMI...")
    
    try:
        # Import aqui para evitar circular imports
        from core.voice_engine import VoiceEngine
        from ui.tamagotchi import TamagotchiUI
        from core.context_manager import ContextManager
        
        logger.info("Componentes carregados com sucesso")
        
        # Inicializar componentes
        context_manager = ContextManager()
        voice_engine = VoiceEngine(context_manager)
        ui = TamagotchiUI(context_manager, voice_engine)
        
        logger.info("YAMI iniciado com sucesso!")
        
        # Iniciar interface
        ui.run()
        
    except ImportError as e:
        logger.error(f"Erro ao importar módulos: {e}")
        logger.info("Certifique-se de instalar as dependências: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Erro ao iniciar YAMI: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
