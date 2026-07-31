import re
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, description="Contraseña para login")

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(
        ..., 
        min_length=2, 
        max_length=100, 
        json_schema_extra={"strip_whitespace": True},
        description="Nombre completo del usuario (solo letras y espacios)"
    )
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=50, 
        description="Debe tener al menos 8 caracteres, 1 mayúscula y 1 número"
    )
    password_confirm: str = Field(
        ...,
        description="Confirmación de la contraseña"
    )

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        # Permitir letras (incluyendo acentos y ñ) y espacios
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', v):
            raise ValueError('El nombre solo puede contener letras y espacios')
        # Limpiar múltiples espacios en el centro y a los lados
        return " ".join(v.split())

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError('La contraseña debe contener al menos una letra mayúscula')
        if not re.search(r'\d', v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v

    @model_validator(mode='after')
    def check_passwords_match(self) -> 'UserRegister':
        if self.password != self.password_confirm:
            raise ValueError('Las contraseñas no coinciden')
        return self
