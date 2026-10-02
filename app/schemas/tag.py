from pydantic import BaseModel, Field, field_validator


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, field_value: str) -> str:
        field_value = field_value.strip().lower()
        if not field_value:
            raise ValueError("must not be blank")
        return field_value


class TagUpdate(TagCreate):
    pass


class TagRead(BaseModel):
    id: int
    name: str


class ProductTagCreate(BaseModel):
    product_id: int = Field(gt=0)
    tag_id: int = Field(gt=0)


class ProductTagRead(BaseModel):
    product_id: int
    tag_id: int