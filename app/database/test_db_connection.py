import asyncio

from sqlalchemy import text

from app.database.database import AsyncSessionLocal


async def test_connection() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT 1"))
        print(result.scalar())


if __name__ == "__main__":
    asyncio.run(test_connection())
