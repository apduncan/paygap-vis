import psycopg2
import csv
import passwords
def pay_from_csv(file):
    with open(file, 'r') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        first = True
        order = ['sic_section', 'sic_division', 'sic_group', 'sic_code']
        process = [process_section, process_section, process_group, process_code]
        idx = 1
        code = ''
        for row in reader:
            if first:
                labels = row
                first = False
            else:
                #map csv attributes column headings to db fields
                #determine which field this should relate to, and work out what the value should be set to
                #if code longer than previous, change index
                if not row[0].isnumeric():
                    idx = 0
                elif not code.isnumeric():
                    idx = idx + 1
                elif len(row[0])>len(code):
                    idx = idx + 1
                elif len(row[0])<len(code):
                    idx = idx - (len(code) - len(row[0]))
                code = row[0]
                field = order[idx]
                func = process[idx]
                func(row[0], field, parse_float(row[2]), parse_float(row[1]))
                print("Code: %s, Level: %s" % (row[0], field))

def process_section(key, field, mean, median):
    query = 'UPDATE paygap.sic SET %s = $1, %s = $1  WHERE %s = $1' % (field+'_mean_pay', field+'_median_pay', field)
    run_query(query, (mean, median, key))

def process_group(key, field, mean, median):
    #convert to a valid group format
    #group is (lead digits, pad 0).(last digit)
    key = str(key)
    last = key[-1]
    first = key[:-1]
    key = first + '.' + last
    #pad with zeroes
    while len(key) < 4:
        key = '0' + key
    query = 'UPDATE paygap.sic SET %s = $1, %s = $1  WHERE %s = $1' % (field+'_mean_pay', field+'_median_pay', field)
    run_query(query, (mean, median, key))

def process_code(key, field, mean, median):
    #this sets for all sic codes falling under this number
    #this is an integer
    key = int(key) * 10
    min_range = key
    max_range = key + 9
    query = 'UPDATE paygap.sic SET %s = $1, %s = $1  WHERE %s BETWEEN $1 AND $1' % (field+'_mean_pay', field+'_median_pay', field)
    run_query(query, (mean, median, min_range, max_range))

def run_query(query, vals):
    with conn:
        with conn.cursor() as cur:
            query = query.replace('$1', '%s')
            print(query)
            print(vals)
            cur.execute(query, vals)

def parse_float(val):
    retval = 0
    try:
        retval = float(val)
    except:
        retval = 0
    return retval




conn = psycopg2.connect(
"dbname=%s user=%s password=%s host=%s" % \
(passwords.DB_DB, passwords.DB_USER, passwords.DB_PASS, passwords.DB_HOST))
#Set to the right schema
cur = conn.cursor()
query = "SET search_path TO '%s';" % (passwords.DB_SCHEMA)
cur.execute(query)
conn.commit()
pay_from_csv('/home/hal/Dropbox/InfoVis/CW2/pay.csv')