"""
Repositorio base genérico.
Provee operaciones CRUD comunes para reutilizar en repos concretos.
"""
from typing import Generic, Optional, Type, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Repositorio genérico con operaciones CRUD básicas.
    Los repos concretos heredan de aquí y agregan queries específicas.
    """

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        """Retorna una entidad por su PK, o None."""
        return await self.session.get(self.model, id)

    async def list_all(self) -> list[ModelType]:
        """Retorna todas las entidades del modelo."""
        result = await self.session.execute(select(self.model))
        return list(result.scalars().all())

    async def add(self, entity: ModelType) -> ModelType:
        """Agrega una entidad a la sesión y la flushea (sin commit)."""
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: ModelType) -> None:
        """Elimina una entidad de la sesión."""
        await self.session.delete(entity)
        await self.session.flush()
