"""
Configuration settings for the Document Processing API.

This module centralizes all configuration settings including API keys,
timeouts, and other environment-dependent variables.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    app_name: str = "Document Processing API"
    app_version: str = "1.0.0"
    app_description: str = "Combine Mistral OCR and LangExtract for advanced document understanding"
    
    # API Keys
    mistral_api_key: Optional[str] = Field(None, env="MISTRAL_API_KEY")
    langextract_api_key: Optional[str] = Field(None, env="LANGEXTRACT_API_KEY")
    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    
    # API Limits
    max_file_size_mb: int = 50
    ocr_timeout_seconds: int = 300
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = Field(False, env="DEBUG")
    
    # Mistral OCR Configuration
    mistral_ocr_url: str = "https://api.mistral.ai/v1/ocr"
    mistral_model: str = "mistral-ocr-latest"
    
    # LangExtract Configuration
    default_model_type: str = "openai"
    default_model_id: str = "gpt-4o"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    @property
    def effective_api_key(self) -> Optional[str]:
        """Get the effective API key for LangExtract (prefers openai_api_key)."""
        return self.openai_api_key or self.langextract_api_key
    
    def validate_configuration(self) -> dict:
        """Validate the configuration and return status."""
        return {
            "mistral_api_configured": bool(self.mistral_api_key),
            "langextract_api_configured": bool(self.effective_api_key),
            "debug_mode": self.debug,
            "max_file_size_mb": self.max_file_size_mb
        }


# Global settings instance
settings = Settings()
