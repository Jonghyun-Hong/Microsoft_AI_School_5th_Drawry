# app/services/azure/openai.py 생성
from openai import AsyncAzureOpenAI
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.azure.exceptions import AzureOpenAIException

class StoryGenerator:
    def __init__(self):
        self.client = AsyncAzureOpenAI(
            api_key=settings.AZURE_OPENAI_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        self.model = settings.AZURE_OPENAI_MODEL_DEPLOYMENT_NAME

    async def generate_story(
        self,
        prompt_data: Dict[str, Any],
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """스토리 생성"""
        try:
            # 프롬프트 구성
            system_message = self._get_system_message()
            user_message = self._format_prompt(prompt_data)
            
            # API 요청
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=max_tokens,
                temperature=0.7,
                presence_penalty=0.6,
                frequency_penalty=0.5
            )
            
            # 응답 처리
            story_content = response.choices[0].message.content
            
            return {
                "content": story_content,
                "prompt_data": prompt_data,
                "tokens_used": response.usage.total_tokens
            }
            
        except Exception as e:
            raise AzureOpenAIException(
                message="Failed to generate story",
                details={"error": str(e)}
            )

    async def modify_story(
        self,
        original_content: str,
        modifications: Dict[str, Any],
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """스토리 수정"""
        try:
            # 수정 프롬프트 구성
            system_message = self._get_modification_system_message()
            user_message = self._format_modification_prompt(
                original_content,
                modifications
            )
            
            # API 요청
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            
            # 응답 처리
            modified_content = response.choices[0].message.content
            
            return {
                "original_content": original_content,
                "modified_content": modified_content,
                "modifications": modifications,
                "tokens_used": response.usage.total_tokens
            }
            
        except Exception as e:
            raise AzureOpenAIException(
                message="Failed to modify story",
                details={"error": str(e)}
            )

    def _get_system_message(self) -> str:
        """시스템 메시지 반환"""
        return """당신은 아이들을 위한 창의적인 동화를 만드는 작가입니다. 
        난독증이 있는 아이들도 쉽게 이해할 수 있도록 간단하고 명확한 언어를 사용하세요.
        각 문장은 짧고 명확해야 하며, 시각적 묘사가 풍부해야 합니다.
        동화는 교육적이면서도 재미있어야 합니다."""

    def _get_modification_system_message(self) -> str:
        """수정을 위한 시스템 메시지 반환"""
        return """당신은 아이들의 동화를 수정하고 개선하는 편집자입니다.
        원래 이야기의 핵심을 유지하면서, 요청된 수정사항을 반영하세요.
        난독증이 있는 아이들을 위해 명확하고 이해하기 쉬운 언어를 사용하세요."""

    def _format_prompt(self, prompt_data: Dict[str, Any]) -> str:
        """프롬프트 포맷팅"""
        template = """
        다음 요소들을 포함한 동화를 만들어주세요:
        
        주인공: {main_character}
        배경: {setting}
        주제: {theme}
        
        다음 요구사항을 반드시 지켜주세요:
        1. 문장은 짧고 명확해야 합니다.
        2. 구체적인 시각적 묘사를 포함해야 합니다.
        3. 간단한 단어를 사용해야 합니다.
        4. 전체 이야기는 {paragraphs}단락으로 구성되어야 합니다.
        """
        
        return template.format(**prompt_data)

    def _format_modification_prompt(
        self,
        original_content: str,
        modifications: Dict[str, Any]
    ) -> str:
        """수정 프롬프트 포맷팅"""
        template = """
        원래 이야기:
        {original_content}
        
        다음 수정사항을 반영해주세요:
        {modifications_list}
        
        수정된 이야기는 원래 이야기의 핵심 내용과 길이를 유지하면서,
        위의 수정사항을 자연스럽게 반영해야 합니다.
        """
        
        modifications_list = "\n".join(
            f"- {key}: {value}" 
            for key, value in modifications.items()
        )
        
        return template.format(
            original_content=original_content,
            modifications_list=modifications_list
        )