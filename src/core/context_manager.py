"""
Context Manager — Gerenciador de contexto conversacional
Responsável por manter estado de conversas e contexto de usuário
"""

import logging
from datetime import datetime
from typing import Dict, List, Any

logger = logging.getLogger(__name__)


class ContextManager:
    """
    Gerencia contexto de conversação e estado do usuário
    
    Funcionalidades:
    - Manter histórico de conversa
    - Rastrear contexto de usuário
    - Gerenciar estado de tarefas
    - Integração com banco de dados
    """
    
    def __init__(self):
        """Inicializa o gerenciador de contexto"""
        self.conversation_history: List[Dict[str, Any]] = []
        self.user_profile: Dict[str, Any] = {}
        self.current_task: Optional[str] = None
        self.habit_data: Dict[str, Any] = {}
        logger.info("Context Manager inicializado")
    
    def add_message(self, role: str, content: str, metadata: Dict = None):
        """
        Adiciona mensagem ao histórico
        
        Args:
            role: "user" ou "assistant"
            content: Conteúdo da mensagem
            metadata: Metadados adicionais
        """
        message = {
            "timestamp": datetime.now().isoformat(),
            "role": role,
            "content": content,
            "metadata": metadata or {}
        }
        self.conversation_history.append(message)
        logger.debug(f"Mensagem adicionada: {role}: {content[:50]}...")
    
    def get_conversation_context(self, max_messages: int = 10) -> List[Dict]:
        """
        Retorna contexto de conversa para LLM
        
        Args:
            max_messages: Número máximo de mensagens anteriores
            
        Returns:
            Lista de mensagens para prompt
        """
        return self.conversation_history[-max_messages:]
    
    def update_user_profile(self, key: str, value: Any):
        """
        Atualiza perfil do usuário
        
        Args:
            key: Chave do perfil
            value: Valor
        """
        self.user_profile[key] = value
        logger.debug(f"Perfil atualizado: {key} = {value}")
    
    def get_user_profile(self, key: str = None) -> Any:
        """
        Retorna dados do perfil do usuário
        
        Args:
            key: Chave específica (None retorna todo perfil)
            
        Returns:
            Dados do perfil
        """
        if key:
            return self.user_profile.get(key)
        return self.user_profile
    
    def set_current_task(self, task_name: str):
        """Define tarefa atual em execução"""
        self.current_task = task_name
        logger.info(f"Tarefa atual definida: {task_name}")
    
    def clear_current_task(self):
        """Limpa tarefa atual"""
        self.current_task = None
        logger.info("Tarefa atual limpa")
    
    def save_habit_data(self, habit_id: str, data: Dict):
        """Salva dados de hábito"""
        self.habit_data[habit_id] = data
        logger.debug(f"Dados de hábito salvos: {habit_id}")
    
    def clear_history(self):
        """Limpa histórico de conversa"""
        self.conversation_history = []
        logger.info("Histórico de conversa limpo")
