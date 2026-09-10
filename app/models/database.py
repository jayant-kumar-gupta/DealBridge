from sqlmodel import Field, SQLModel


class Category(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    slug: str | None = Field(index=True, default=None)
    description: str | None = Field(default=None)
    icon: str | None = Field(default=None) #icon field will contain the path for image for a category
    product_count: int = Field(default=0, sa_column_kwargs={"server_default": "0"})

class Users(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password: str
    firstname: str | None = Field(default = None)
    lastname: str | None = Field(default = None)
    is_admin: bool = Field(default=False)


# class Admins(SQLModel, table = True):
#     id: int | None = Field(default=None, primary_key=True)
#     email: str = Field(unique=True)
#     password: str