# app/utils/prompt.py 생성
from typing import Dict
from app.core.exceptions import DrawryException

class PromptGenerator:
    def __init__(self):
        self.template = "{A}가 {B}해서 {C}하다"

    def validate_selections(self, selections: Dict[str, Dict[str, str]]) -> bool:
        required_keys = ["A", "B", "C"]
        for key in required_keys:
            if key not in selections:
                raise DrawryException(
                    code="INVALID_PROMPT",
                    message=f"Missing prompt selection for position {key}",
                    status_code=400
                )
            if "answer" not in selections[key]:
                raise DrawryException(
                    code="INVALID_PROMPT",
                    message=f"Missing answer for position {key}",
                    status_code=400
                )
        return True

    def generate_prompt(self, selections: Dict[str, Dict[str, str]]) -> Dict:
        """프롬프트 생성"""
        self.validate_selections(selections)
        
        prompt_data = {
            "selections": {
                "A": {"question": selections["A"].get("question", ""),
                      "answer": selections["A"]["answer"],
                      "position": "가"},
                "B": {"question": selections["B"].get("question", ""),
                      "answer": selections["B"]["answer"],
                      "position": "해서"},
                "C": {"question": selections["C"].get("question", ""),
                      "answer": selections["C"]["answer"],
                      "position": "하다"}
            },
            "template": self.template,
            "final_prompt": self.template.format(
                A=selections["A"]["answer"],
                B=selections["B"]["answer"],
                C=selections["C"]["answer"]
            )
        }
        return prompt_data