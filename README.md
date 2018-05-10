# paygap-vis
University coursework project to visualize UK 2018 gender pay gap reporting.
Consists of some basic Python scripts to import data into a PostgreSQL database, and nodejs application running a server providing the visualisations and a REST API for accessing the data.

# Structure
##/PaygapAPI/
Contains the nodejs server which runs a REST API to provide data, and serves static HTML and Javascript which provides the front end.

##/DataImport/
Python scripts used to import data from the pay gap service csv files, and to scrape information from Companies House and genderise.io APIs.

##/data/
Data used to construct the database

# Installation
## Node Server
- Requires nodejs 7 or higher
- Clone this repository 
- Import the database dump final_dump into Postgres
- Refresh all materialized views: `REFRESH MATERIALIZED VIEW co_director_count; REFRESH MATERIALIZED VIEW company_sic_null;`
- Grant SELECT privileges on all tables and views in the `paygap` schema to the Postgres user you will use to connect
- In PaygapAPI directory, run `npm install`
- In PaygapAPI directory, run `PGUSER=$user$ PGHOST=$localhost$ PGDATABASE=$database$ PGPASSWORD=$password$ npm run start 
  - $user$ is your Postgres username, $password$ is the password an so on. Note that Postgres will have to be configured to use password rather than peer authentication. See [here](https://wiki.postgresql.org/wiki/Client_Authentication) for more.
- The server will run on port 3000 by default

## DataImport
- In the DataImport directory, create a file `passwords.py`
- Put the following in `passwords.py`
```
DB_USER = 'username'
DB_PASS = 'password'
DB_DB = 'database'
DB_SCHEMA = 'schema'
DB_HOST = 'localhost'
CH_KEY = 'companies_house_api_key'
```
- The data import functions are in `paygap.py`. You will need to edit the main function to change what gets called.
