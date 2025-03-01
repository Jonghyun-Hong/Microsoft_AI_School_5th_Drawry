# app/services/azure/controlnet.py 생성
import aiohttp
from typing import List
from app.core.config import settings
from app.core.exceptions import ImageGenerationException

class ControlNetService:
    def __init__(self):
        self.api_url = settings.CONTROLNET_API_URL

    async def generate_images(self, sketch_url: str, prompt: str) -> List[str]:
        """ControlNet API를 통해 이미지 생성"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/generate",
                    json={
                        "sketch_url": sketch_url,
                        "prompt": prompt
                    }
                ) as response:
                    if response.status != 200:
                        raise ImageGenerationException(
                            message="Failed to generate images",
                            details={"status": response.status}
                        )
                    
                    result = await response.json()
                    return result.get("image_urls", [])

        except aiohttp.ClientError as e:
            raise ImageGenerationException(
                message="Failed to connect to ControlNet service",
                details={"error": str(e)}
            )