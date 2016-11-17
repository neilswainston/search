'''
PartsGenie (c) University of Manchester 2015

PartsGenie is licensed under the MIT License.

To view a copy of this license, visit <http://opensource.org/licenses/MIT/>.

@author:  neilswainston
'''
import json
import os
import re
import sys
import tempfile
import traceback
import urllib
import urllib2
import uuid

from Bio import SeqIO
from Bio.PDB.Entity import Entity
from flask import Flask, jsonify, request, Response

from synbiochem.utils import sequence_utils, taxonomy_utils
import libchebipy


# Configuration:
DEBUG = True
SECRET_KEY = str(uuid.uuid4())

# Create application:
_STATIC_FOLDER = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                              'static')
APP = Flask(__name__, static_folder=_STATIC_FOLDER)
APP.config.from_object(__name__)


@APP.route('/')
def home():
    '''Renders homepage.'''
    return APP.send_static_file('index.html')


@APP.route('/organisms/<term>')
def get_organisms(term):
    '''Gets organisms from search term.'''
    return json.dumps(taxonomy_utils.search(term))


@APP.route('/chemicals/<term>')
def get_chemicals(term):
    '''Gets organisms from search term.'''
    return json.dumps([{'id': entity.get_id(), 'name': entity.get_name()}
                       for entity in libchebipy.search(term)])


@APP.route('/enzymes/<term>')
def get_enzymes(term):
    '''Gets organisms from search term.'''
    uniprot_vals = sequence_utils.search_uniprot(term,
                                                 ['entry name',
                                                  'protein names',
                                                  'organism',
                                                  'sequence',
                                                  'database(PDB)',
                                                  'feature(BETA STRAND)',
                                                  'feature(HELIX)',
                                                  'feature(TURN)'],
                                                 limit=10)

    result = []

    for key, value in uniprot_vals.iteritems():
        pdb_key = 'Cross-reference (PDB)'
        value[pdb_key] = [_get_pdb_data(pdb_id)
                          for pdb_id in value.pop(pdb_key, '').split(';')
                          if len(pdb_id) > 0]
        value['id'] = key

        value['Beta strand'] = _get_secondary_data(value.get('Beta strand',
                                                             ''))
        value['Helix'] = _get_secondary_data(value.get('Helix', ''))
        value['Turn'] = _get_secondary_data(value.get('Turn', ''))

        result.append(value)

    return json.dumps(result)


def _get_pdb_data(pdb_id):
    '''Returns PDB sequence data.'''
    url = 'http://www.rcsb.org/pdb/download/downloadFile.do' + \
        '?fileFormat=FASTA&compression=NO&structureId=' + \
        pdb_id

    temp_file = tempfile.NamedTemporaryFile()
    urllib.urlretrieve(url, temp_file.name)
    fasta_seqs = SeqIO.parse(open(temp_file.name), 'fasta')

    return {'id': pdb_id, 'chains': {fasta.id[len(pdb_id) + 1:len(pdb_id) + 2]:
                                     str(fasta.seq)
                                     for fasta in fasta_seqs}}


def _get_secondary_data(strng):
    '''Gets secondary structure data.'''
    if len(strng) > 0:
        fields = ['start', 'end', 'pdb']
        return [dict(zip(fields, _parse_secondary_struct(s)))
                for s in strng.split('.; ')]
    return []


def _parse_secondary_struct(strng):
    '''Parses secondary structure string.'''
    regex = r' (\d*) (\d*).*PDB:(\w*)'
    terms = re.findall(regex, strng)[0]
    return int(terms[0]), int(terms[1]), terms[2]


@APP.errorhandler(Exception)
def handle_exception(err):
    '''Exception handling method.'''
    response = jsonify({'message': err.__class__.__name__ + ': ' + str(err)})
    response.status_code = 500
    return response
