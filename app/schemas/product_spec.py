from pydantic import BaseModel, Field, field_validator


class ProductSpecCreate(BaseModel):
    product_id: int
    label: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=500)

    @field_validator("label", "value")
    @classmethod
    def strip_text(cls, field_value: str) -> str:
        field_value = field_value.strip()
        if not field_value:
            raise ValueError("must not be blank")
        return field_value


class ProductSpecUpdate(BaseModel):
    value: str = Field(min_length=1, max_length=500)

    @field_validator("value")
    @classmethod
    def strip_value(cls, field_value: str) -> str:
        field_value = field_value.strip()
        if not field_value:
            raise ValueError("must not be blank")
        return field_value


class ProductSpecRead(BaseModel):
    product_id: int
    label: str
    value: str