'''Import pay gap reporting data, and scrape related info from web'''
import csv
import datetime
import hashlib
import time
from abc import ABC, abstractmethod
from requests import HTTPError
import chwrapper
import psycopg2
import passwords
from genderize import Genderize

class Entity(ABC):
    '''Abstract class which can handle storing / retrieving'''
    _conn = None

    def __init__(self):
        #data exclusively for fields which need to be represented in database
        #other information should live in instance / class variables
        self._data = {}

    @classmethod
    @abstractmethod
    def table(cls):
        '''Table which this entity is stored in'''
        raise NotImplementedError('Abstract method has no implementation')

    @classmethod
    @abstractmethod
    def id_field(cls):
        '''Columnn which is the key for this entity, to be retrieved on'''
        raise NotImplementedError('Abstract method has no implementation')

    def data(self):
        '''Dictionary of entity data'''
        return self._data

    @classmethod
    def get_all(cls):
        '''Retrieve all entities from DB'''
        query = "SELECT * FROM %s;" % (cls.table())
        cur = Entity._get_conn().cursor()
        cur.execute(query)
        results = []
        labels = [field[0] for field in cur.description]
        #place all results into list so we can close cursor
        rows = [row for row in cur]
        cur.close()
        #create entities of relevant class from result rows
        results = [cls.from_row(dict(zip(labels, row))) for row in rows]
        return results

    @classmethod
    def get_secondary(cls, key, value):
        '''Retrieve a list of entities matching a specific secondary key'''
        query = "SELECT * FROM %s WHERE %s"
        query = query % (cls.table(), key + ' = %s')
        conn = cls._get_conn()
        with conn:
            with conn.cursor() as cur:
                cur.execute(query, [value])
                rows = [row for row in cur]
                labels = [field[0] for field in cur.description]
                cur.close()
                results = [cls.from_row(dict(zip(labels, row))) for row in rows]
                return results

    @classmethod
    def get_by_id(cls, find_id):
        '''Retrieve a specific field by it's key'''
        query = "SELECT * FROM %s WHERE %s"
        query = query % (cls.table(), cls.id_field() + ' = %s')
        conn = cls._get_conn()
        with conn:
            with conn.cursor() as cur:
                cur.execute(query, [find_id])
                result = cur.fetchone()
                labels = [data[0] for data in cur.description]
                return cls.from_row(dict(zip(labels, result)))

    def save(self):
        '''Insert or update this entity into the DB'''
        #Build and attempt and insert query. If this fails, try update.
        query = "INSERT INTO %s (%s) VALUES (%s);"
        #Build column list
        col_list = [key for key in self._data.keys()]
        val_list = [self._data[key] for key in col_list]
        #Make strings to create query
        col_string = ', '.join(col_list)
        val_string = ', '.join(['%s' for x in range(0, len(val_list))])
        query = query % (self.table(), col_string, val_string)
        #Attempt to execute query
        conn = self._get_conn()
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(query, val_list)
        except psycopg2.IntegrityError:
            query = "UPDATE %s SET %s WHERE %s"
            set_list = [field + '=%s' for field in col_list]
            set_string = ', '.join(set_list)
            where_string = self.id_field() + ' = %s'
            query = query % (self.table(), set_string, where_string)
            with conn:
                with conn.cursor() as cur:
                    cur.execute(query, val_list + [self._data[self.id_field()]])

    @classmethod
    def from_row(cls, row):
        '''Create an object from the row of the DB. Extend if any extra behaviour required'''
        obj = cls()
        obj._data = row
        return obj

    @classmethod
    def _get_conn(cls):
        '''Return a database connection for use in retrieval and storage'''
        if not Entity._conn:
            Entity._conn = psycopg2.connect(
                "dbname=%s user=%s password=%s host=%s" % \
                (passwords.DB_DB, passwords.DB_USER, passwords.DB_PASS, passwords.DB_HOST))
            #Set to the right schema
            cur = Entity._conn.cursor()
            query = "SET search_path TO '%s';" % (passwords.DB_SCHEMA)
            cur.execute(query)
            Entity._conn.commit()
        return Entity._conn

class Company(Entity):
    '''A company represnted in pay gap data. Contains methods to find directors'''
    HASH_FIELDS = ['co_number', 'co_name', 'co_sic_codes_csv']
    _chclient = chwrapper.Search(access_token=passwords.CH_KEY)
    #mapping changed on 13-02-2018, csv changed field names
    #_mapping = {'co_name': 'EmployerName', 'co_address_csv': 'Address', 'co_number': 'CompanyNumber', 'co_sic_codes_csv': 'SicCodes', 'co_diff_hourly_mean': 'DiffMeanHourlyPayPercent', 'co_diff_hourly_median': 'DiffMedianHourlyPercent', 'co_diff_bonus_mean': 'DiffMeanBonusPercent', 'co_diff_bonus_median': 'DiffMedianBonusPercent', 'co_male_median_bonus': 'MaleMedianBonusPayPercent', 'co_female_median_bonus': 'FemaleMedianBonusPayPercent', 'co_male_lower_band': 'MaleLowerPayBand', 'co_female_lower_band': 'FemaleLowerPayBand', 'co_male_middle_band': 'MaleMiddlePayBand', 'co_female_middle_band': 'FemaleMiddlePayBand', 'co_male_upper_band': 'MaleUpperPayBand', 'co_female_upper_band': 'FemaleUpperPayBand', 'co_male_upper_quartile': 'MaleUpperQuartilePayBand', 'co_female_uppdate_quartile': 'FemaleUpperQuartilePayBand', 'co_link': 'CompanyLinkToGPGInfo', 'co_responsible_person': 'ResponsiblePerson'}
    _mapping = {'co_name': 'EmployerName', 'co_address_csv': 'Address', 'co_number': 'CompanyNumber', 'co_sic_codes_csv': 'SicCodes', 'co_diff_hourly_mean': 'DiffMeanHourlyPercent', 'co_diff_hourly_median': 'DiffMedianHourlyPercent', 'co_diff_bonus_mean': 'DiffMeanBonusPercent', 'co_diff_bonus_median': 'DiffMedianBonusPercent', 'co_male_median_bonus': 'MaleBonusPercent', 'co_female_median_bonus': 'FemaleBonusPercent', 'co_male_lower_band': 'MaleLowerQuartile', 'co_female_lower_band': 'FemaleLowerQuartile', 'co_male_middle_band': 'MaleLowerMiddleQuartile', 'co_female_middle_band': 'FemaleLowerMiddleQuartile', 'co_male_upper_band': 'MaleUpperMiddleQuartile', 'co_female_upper_band': 'FemaleUpperMiddleQuartile', 'co_male_upper_quartile': 'MaleTopQuartile', 'co_female_uppdate_quartile': 'FemaleTopQuartile', 'co_link': 'CompanyLinkToGPGInfo', 'co_responsible_person': 'ResponsiblePerson'}

    def __init__(self):
        super().__init__()
        self.directors = []

    @classmethod
    def table(cls):
        return 'company'

    @classmethod
    def id_field(cls):
        return 'co_hash'

    @classmethod
    def all_from_csv(cls, path):
        '''Load pay gap csv and create company objects'''
        #Load csv and convert to objects
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
                    db_row = {}
                    csv_row = dict(zip(labels, row))
                    for key in cls._mapping.keys():
                        db_row[key] = csv_row[cls._mapping[key]]
                    results.append(Company.from_row(db_row))
            return results

    @classmethod
    def from_row(cls, row):
        #Extends method to also retrieve all directors from db
        co = super().from_row(row)
        if not 'co_hash' in co._data:
            co.get_hash()
        co.directors = Director.get_secondary('co_hash', co._data['co_hash'])
        return co
    
    def get_hash(self):
        '''Generate hash value from company fields'''
        hash_string = ''
        for key in self.HASH_FIELDS:
            hash_string += self._data[key]
        digest = hashlib.sha256(hash_string.encode('utf-8')).hexdigest()
        self._data['co_hash'] = digest
        return digest
    
    def parse_sic(self, refresh=False):
        '''Turns sic codes from csv into link table records'''
        sic_list = self._data['co_sic_codes_csv'].split(",")
        cosic_map = ['co_hash', 'sic_code']
        #this is where we determine public / private
        #assume private by default
        self._data['co_public'] = False
        #remove any empty strings from list
        sic_list = [val for val in sic_list if len(val) > 0]
        for sic in sic_list:
            cln_sic = sic.strip()
            #if this is a 1, this is actually a flag indicating public sector
            if int(sic) == 1:
                self._data['co_public'] = True
            else:
                sic_obj = CompanySic.from_row(dict(zip(cosic_map, [self._data[self.id_field()], cln_sic])))
                try:
                    sic_obj.save()
                except Exception:
                    print("Error saving company_sic record - may already exist")
        self.save()

    def fetch_directors(self, refresh=False):
        '''Gets director info from Companies House. If refresh true, gets if already exist'''
        if (refresh or not self.directors) and len(self._data['co_number']) > 0:
            resp = self._chclient.officers(self._data['co_number'], items_per_page=100)
            #Check if we've exceeded the limit
            if resp.status_code == 429:
                raise IOError('600 request/minute limit exceeded')
            if resp.status_code == 404:
                raise AttributeError('Company number not found')
            #iterate through and find any directors
            results = []
            for person in resp.json()['items']:
                if person['officer_role'].strip().lower() == 'director' \
                and 'resigned_on' not in person:
                    #this is a director, create and add to list
                    results.append(Director.from_json(person, self._data['co_hash']))
            self.directors = results
            return True
        else:
            return False

    def save(self):
        super().save()
        for director in self.directors:
            director.save()

class Sic(Entity):
    '''An industry classification'''
    @classmethod
    def table(cls):
        return 'sic'
    
    @classmethod
    def id_field(cls):
        return 'sic_code'

class CompanySic(Entity):
    '''Link between a company and SIC classification'''
    @classmethod
    def table(cls):
        return 'company_sic'
    
    @classmethod
    def id_field(cls):
        raise RuntimeError("Cannot retrieve entity by id")

class Gender(Entity):
    '''A genderize.io reponse record'''

    @classmethod
    def table(cls):
        return 'genderize'

    @classmethod
    def id_field(cls):
        return 'g_name'

    @classmethod
    def from_row(cls, row):
        obj = super().from_row(row)
        #Properly code the gender
        gender = obj._data['g_gender']
        if gender == 'male':
            gender = 'M'
        elif gender == 'female':
            gender = 'F'
        elif not gender:
            gender = ' U'
        obj._data['g_gender'] = gender
        return obj

class Genderiser:
    '''Gets gender info for a director from genderize.io'''
    #Want to minimise requests, so storing results in DB
    #Restore to a dictionary and lookup before making genderize.io request

    def __init__(self):
        rows = Gender.get_all()
        self.names = {}
        for gender in rows:
            self.names[gender._data['g_name']] = gender

    def get_gender(self, director):
        '''Assign a gender to this director if possible, and save'''
        #Get forenames in array
        name_list = director._data['dir_forenames'].strip().split(" ")
        i = 0
        assigned = None
        while (not assigned) and (i < len(name_list)):
            #See if this name has a response
            result = self.check_name(name_list[i])
            i += 1
            if result:
                if result._data['g_gender'] != 'U':
                    assigned = result
        if assigned:
            director._data['dir_gender'] = assigned._data['g_gender']
            director._data['dir_gender_prob'] = assigned._data['g_prob']
            director._data['dir_gendered_date'] = datetime.datetime.now()
            director.save()
        else:
            director._data['dir_gender'] = 'U'
            director._data['dir_gender_prob'] = None
            director._data['dir_gendered_date'] = datetime.datetime.now()
            director.save()

    def check_name(self, name):
        '''Get a gender for a specific name string'''
        #Try to find name in stored response first
        if name in self.names:
            print("In list")
            return self.names[name]
        else:
            #Request info from genderize.io
            print("Requesting from genderize.io")
            response = Genderize().get([name], country_id='gb')
            time.sleep(0.3)
            if response[0]['gender']:
                response = response[0]
                row = {'g_name' : response['name'], 'g_gender' : response['gender'], 'g_prob' : response['probability'], 'g_count' : response['count']}
                gender = Gender.from_row(row)
                gender.save()
                self.names[row['g_name']] = gender
                return gender
            else:
                response = response[0]
                row = {'g_name' : response['name'], 'g_gender' : 'U', 'g_prob' : None, 'g_count' : None}
                gender = Gender.from_row(row)
                gender.save()
                self.names[row['g_name']] = gender
                return None

class Director(Entity):
    '''Directors of a company. Contains methods and logic to try to genderise'''
    genderiser = Genderiser()

    @classmethod
    def table(cls):
        return 'director'

    @classmethod
    def id_field(cls):
        return 'dir_id'

    @classmethod
    def from_json(cls, json, co_hash):
        '''Create a director from item in companies house json'''
        director = Director()
        split_name = json['name'].split(',')
        director._data['dir_forenames'] = split_name[1].lower().strip()
        director._data['dir_surname'] = split_name[0].lower().strip()
        if 'date_of_birth' in json:
            dob = json['date_of_birth']
            director._data['dir_dob'] = datetime.datetime(day=1, month=dob['month'], year=dob['year'])
        if 'appointed_on' in json:
            director._data['dir_appointed'] = json['appointed_on']
        director._data['co_hash'] = co_hash
        return director

    def genderise(self):
        '''Find a gender for this director'''
        self.genderiser.get_gender(self)

def get_all_directors():
    #fetch all companies
    cos = Company.get_all()
    invalid = []
    for co in cos:
        wait = 0
        try:
            print("Fetching %s" % co._data['co_name'])
            if co.fetch_directors():
                co.save()
                wait = 0.3
        except HTTPError:
            invalid.append("Invalid co number: %s::%s" % (co._data['co_name'], co._data['co_hash']))
        time.sleep(wait)
    print("Errors fetching:")
    print(invalid)

def gender_all_directors():
    directors = Director.get_all()
    for director in directors:
        print(director._data['dir_forenames'])
        director.genderise()

'''
for ONE in Company.get_all():
    print("Fetching directors for %s" % [ONE._data['co_name']])
    errors = []
    try:
        ONE.fetch_directors()
        ONE.save()
        time.sleep(0.3)
    except Exception:
        print("Error fetching for above company")
        errors.append((ONE._data['co_name'], ONE._data['co_hash']))
print("Errors fetching the below companies")
print(errors)
'''

if __name__ == "__main__":
    gender_all_directors()

'''
for company in companies:
    for director in company.directors:
        if not director._data['dir_gender']:
            print("Gendering %s of %s" % (director._data['dir_forenames'], company._data['co_name']))
            director.genderise()
'''
