# for database
- download pgadmin 
- download postgre

# create virtual environment
- run `python3 -m venv env`
- run `source env/bin/activate`

# Install all dependencies.
- Run `pip install -r requirements-dev.txt`

# How to run app. Using Docker with PostgreSQL.
- Install Docker Desktop
- Run `docker compose up --build`
- Run `docker compose down` to stop all services

# How to run locally without postgres or docker.
- run `uvicorn app.main:app --reload`

# How to run tests.
- Run `pytest` to run all tests


