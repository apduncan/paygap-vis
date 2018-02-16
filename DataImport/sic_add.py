import csv
import psycopg2
import passwords

conn = psycopg2.connect(
                "dbname=%s user=%s password=%s host=%s" % \
                (passwords.DB_DB, passwords.DB_USER, passwords.DB_PASS, passwords.DB_HOST))
#Set to the right schema
cur = conn.cursor()
query = "SET search_path TO '%s';" % (passwords.DB_SCHEMA)
cur.execute(query)
conn.commit()

path = '../sic_splits.csv'
#Utility to add some exta information to sic table
with open(path, 'r') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    first = True
    results = []
    for row in reader:
        if first:
            labels = row
            first = False
        else:
            #map csv attributes column headings to db fields
            #insert to db
            col_list = labels[1:]
            values = [field.strip() for field in row[1:]]
            query = "UPDATE sic SET %s WHERE %s"
            set_list = [field + '=%s' for field in col_list]
            set_string = ', '.join(set_list)
            where_string = 'sic_code = %s'
            query = query % (set_string, where_string)
            with conn:
                with conn.cursor() as cur:
                    cur.execute(query, values + [row[0]])


