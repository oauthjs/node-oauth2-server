# -*- coding: utf-8 -*-
""" Helper module for sphinx' conf.py.

    Useful when building documentation for npm packages.
"""

import json
import re
from datetime import datetime

def load_package_json(path):
    """ Loads package.json from 'path'.
    """
    with open(path) as f:
        return json.load(f)

def get_short_version(version):
    """ Extracts the short version ("x.y.z") from 'version'.
    """
    match = re.match('^(\d+(?:\.\d+){2})', version)
    if not match:
        raise Error('invalid version')
    return match.group()

def get_copyright_year(base_year):
    """ Returns the year(s) to be shown in the copyright notice.

        If base_year is the current year:
            'nnnn' where nnnn is 'base_year'
        If the current year is larger than base_year:
            'nnnn-mmmm' where nnnn is 'base_year' and mmmm is the current year
    """
    this_year = datetime.now().year
    fmt = '{base_year}-{this_year}' if this_year > base_year else '{this_year}'
    return fmt.format(base_year=base_year, this_year=this_year)

def get_config():
    package = load_package_json('../package.json')
    return {
        'name': package['name'],
        'version': package['version'],
        'short_version': get_short_version(package['version']),
        'organization': 'oauthjs',
        'copyright_year': get_copyright_year(2016),
        # TODO: Get authors from package.
        'docs_author': 'Max Truxa',
        'docs_author_email': 'dev@maxtruxa.com'
    }

