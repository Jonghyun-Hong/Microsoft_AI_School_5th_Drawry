# app/utils/game.py 생성
from typing import Dict, Any, Optional
from datetime import datetime
from app.schemas.game import GameStatus, GameType

class GameProgressTracker:
    @staticmethod
    def calculate_score(game_type: GameType, progress_data: Dict[str, Any]) -> int:
        """게임 타입별 점수 계산"""
        if game_type == GameType.READING:
            return GameProgressTracker._calculate_reading_score(progress_data)
        elif game_type == GameType.WORD_MATCHING:
            return GameProgressTracker._calculate_matching_score(progress_data)
        elif game_type == GameType.SENTENCE_ORDERING:
            return GameProgressTracker._calculate_ordering_score(progress_data)
        return 0

    @staticmethod
    def _calculate_reading_score(progress_data: Dict[str, Any]) -> int:
        """읽기 연습 점수 계산"""
        reading_time = progress_data.get('reading_time', 0)
        accuracy = progress_data.get('accuracy', 0)
        return int((accuracy * 100) - (reading_time * 0.1))

    @staticmethod
    def _calculate_matching_score(progress_data: Dict[str, Any]) -> int:
        """단어 매칭 점수 계산"""
        correct_matches = progress_data.get('correct_matches', 0)
        attempts = progress_data.get('attempts', 0)
        if attempts == 0:
            return 0
        return int((correct_matches / attempts) * 100)

    @staticmethod
    def _calculate_ordering_score(progress_data: Dict[str, Any]) -> int:
        """문장 순서 점수 계산"""
        correct_orders = progress_data.get('correct_orders', 0)
        total_sentences = progress_data.get('total_sentences', 0)
        if total_sentences == 0:
            return 0
        return int((correct_orders / total_sentences) * 100)

class GameAnalyzer:
    @staticmethod
    def analyze_progress(
        game_type: GameType,
        progress_data: Dict[str, Any],
        total_games: int
    ) -> Dict[str, Any]:
        """게임 진행 상황 분석"""
        analysis = {
            "game_type": game_type,
            "total_games": total_games,
            "current_score": GameProgressTracker.calculate_score(game_type, progress_data)
        }

        if game_type == GameType.READING:
            analysis.update(GameAnalyzer._analyze_reading(progress_data))
        elif game_type == GameType.WORD_MATCHING:
            analysis.update(GameAnalyzer._analyze_matching(progress_data))
        elif game_type == GameType.SENTENCE_ORDERING:
            analysis.update(GameAnalyzer._analyze_ordering(progress_data))

        return analysis

    @staticmethod
    def _analyze_reading(progress_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "average_reading_time": progress_data.get('reading_time', 0),
            "accuracy_rate": progress_data.get('accuracy', 0),
            "focus_points": progress_data.get('focus_points', [])
        }

    @staticmethod
    def _analyze_matching(progress_data: Dict[str, Any]) -> Dict[str, Any]:
        attempts = progress_data.get('attempts', 0)
        correct = progress_data.get('correct_matches', 0)
        return {
            "success_rate": (correct / attempts) if attempts > 0 else 0,
            "average_time_per_match": progress_data.get('average_time', 0),
            "difficult_words": progress_data.get('difficult_words', [])
        }

    @staticmethod
    def _analyze_ordering(progress_data: Dict[str, Any]) -> Dict[str, Any]:
        total = progress_data.get('total_sentences', 0)
        correct = progress_data.get('correct_orders', 0)
        return {
            "accuracy_rate": (correct / total) if total > 0 else 0,
            "completion_time": progress_data.get('completion_time', 0),
            "error_patterns": progress_data.get('error_patterns', [])
        }