""" fabfile to prepare the notebook """

import json
import os
import tempfile
import urllib2
import shutil

from io import BytesIO
from tarfile import TarFile
from zipfile import ZipFile

from fabric.api import local,lcd
from fabric.utils import abort

pjoin = os.path.join

here = os.path.dirname(__file__)

static_dir = here
components_dir = pjoin(static_dir, 'components')

def clean():
    if os.path.exists(components_dir):
        shutil.rmtree(components_dir)

def components():
    """install components with bower"""
    with lcd(static_dir):
        local('bower install')

def nonbower():
    if not os.path.exists(components_dir):
        components()
    
    with open("nonbower.json") as f:
        cfg = json.load(f)
    for name, repo in cfg.get('dependencies', {}).items():
        
        clone = "git clone"
        if '#' in repo:
            repo, tag = repo.split('#')
        else:
            tag = None
            clone += " --depth 1"
        
        with lcd(components_dir):
            
            local("{clone} {repo} {name}".format(**locals()))
            
            if tag:
                with lcd(pjoin(components_dir, name)):
                    local("git checkout -b {0} tags/{0}".format(tag))
        
        # remove the git tree, so we don't get submodules
        shutil.rmtree(pjoin(components_dir, name, '.git'))

def postprocess():
    with lcd(pjoin(components_dir, "bootstrap")):
        local("npm install")
        local("make bootstrap-css")
        local("make bootstrap-js")
    
    # build less
    shutil.rmtree(pjoin(components_dir, "less.js", "dist"))
    with lcd(pjoin(components_dir, "less.js")):
        local("make less")
    
    # build highlight.js
    with lcd(pjoin(components_dir, "highlight.js")):
        local("python tools/build.py")

def update():
    clean()
    components()
    nonbower()
    postprocess()
