"""YAMI Writing Style Analysis System

Módulo de análise e adaptação ao estilo de comunicação do usuário.
Permite que o YAMI compreenda, armazene e reproduza o padrão
pessoal de linguagem do usuário quando solicitado.

Princípios:
- Adaptação gradual
- Aprendizado contínuo
- Consistência estilística
- Personalização
- Transparência
- Possibilidade de ajuste manual
"""

__version__ = "1.0.0"

from .profile import WritingProfile, StyleProfile, load_profile, save_profile, reset_profile
from .analyzer import WritingAnalyzer
from .prompt import build_style_section, build_compact_style_section, build_style_instruction_line
