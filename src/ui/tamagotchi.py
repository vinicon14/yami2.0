"""
Tamagotchi UI — Interface visual minimalista do YAMI
Avatar animado e indicadores de estado
"""

import logging
from typing import Optional, Callable

logger = logging.getLogger(__name__)


class TamagotchiUI:
    """
    Interface Tamagotchi minimalista
    
    Funcionalidades:
    - Avatar animado
    - Indicadores de estado (pensando, ouvindo, etc)
    - Chat integrado
    - Feedback visual
    """
    
    def __init__(self, context_manager, voice_engine):
        """
        Inicializa interface Tamagotchi
        
        Args:
            context_manager: Gerenciador de contexto
            voice_engine: Motor de voz
        """
        self.context_manager = context_manager
        self.voice_engine = voice_engine
        self.state = "idle"  # idle, listening, thinking, speaking
        self.is_running = False
        logger.info("Tamagotchi UI inicializada")
    
    def run(self):
        """Inicia loop da interface"""
        self.is_running = True
        logger.info("Iniciando loop da interface...")
        
        try:
            # TODO: Implementar com PyQt6 ou similar
            self._main_loop()
        except KeyboardInterrupt:
            logger.info("Encerrando YAMI...")
            self.stop()
    
    def _main_loop(self):
        """Loop principal da interface"""
        logger.info("Loop principal iniciado")
        
        while self.is_running:
            # TODO: Processar eventos da UI
            # TODO: Chamar voice_engine para escuta
            # TODO: Processar respostas
            pass
    
    def stop(self):
        """Para interface"""
        self.is_running = False
        logger.info("Interface parada")
    
    def set_state(self, new_state: str):
        """
        Define novo estado visual
        
        Args:
            new_state: Novo estado (idle, listening, thinking, speaking)
        """
        self.state = new_state
        logger.debug(f"Estado alterado para: {new_state}")
        self._update_avatar_animation()
    
    def _update_avatar_animation(self):
        """Atualiza animação do avatar baseado no estado"""
        states_animation = {
            "idle": "blink",
            "listening": "listening_animation",
            "thinking": "thinking_animation",
            "speaking": "speaking_animation"
        }
        animation = states_animation.get(self.state, "blink")
        logger.debug(f"Animação atualizada: {animation}")
    
    def show_message(self, message: str, role: str = "assistant"):
        """
        Mostra mensagem no chat
        
        Args:
            message: Texto da mensagem
            role: "user" ou "assistant"
        """
        logger.info(f"[{role}] {message}")
        # TODO: Implementar renderização no UI
    
    def show_loading(self):
        """Mostra indicador de carregamento"""
        self.set_state("thinking")
    
    def hide_loading(self):
        """Esconde indicador de carregamento"""
        self.set_state("idle")
    
    def show_notification(self, message: str, duration: int = 3):
        """
        Mostra notificação temporária
        
        Args:
            message: Texto da notificação
            duration: Duração em segundos
        """
        logger.info(f"Notificação: {message}")
        # TODO: Implementar animação de notificação
