# app/services/azure/storage.py 생성
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import AzureError
from fastapi import UploadFile
from app.core.config import settings
from app.core.exceptions import FileUploadException
import uuid

class AzureStorageService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.sketches_container = settings.AZURE_STORAGE_CONTAINER_SKETCHES
        self.generated_container = settings.AZURE_STORAGE_CONTAINER_GENERATED
        self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)

    async def upload_sketch(self, file: UploadFile) -> str:
        """스케치 이미지 업로드"""
        try:
            container_client = self.blob_service_client.get_container_client(self.sketches_container)
            blob_name = f"sketch_{uuid.uuid4()}{self.get_file_extension(file.filename)}"
            blob_client = container_client.get_blob_client(blob_name)
            
            contents = await file.read()
            blob_client.upload_blob(contents)
            
            return blob_client.url

        except AzureError as e:
            raise FileUploadException(
                message="Failed to upload sketch",
                details={"error": str(e)}
            )

    async def upload_generated_image(self, image_data: bytes, filename: str) -> str:
        """생성된 이미지 업로드"""
        try:
            container_client = self.blob_service_client.get_container_client(self.generated_container)
            blob_name = f"generated_{uuid.uuid4()}{self.get_file_extension(filename)}"
            blob_client = container_client.get_blob_client(blob_name)
            
            blob_client.upload_blob(image_data)
            return blob_client.url

        except AzureError as e:
            raise FileUploadException(
                message="Failed to upload generated image",
                details={"error": str(e)}
            )

    def get_file_extension(self, filename: str) -> str:
        """파일 확장자 추출"""
        return f".{filename.split('.')[-1]}" if '.' in filename else ''