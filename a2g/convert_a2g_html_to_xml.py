#!/usr/bin/python2.6

import os

for s in ['tahoe-truckee-hs', 'north-tahoe-hs']:
    for i in range(2003, 2012):
        basename = s + '-' + str(i)
        h = 'file:///home/wex/src/a2g/' + basename + '.html'
        x = basename + '.xml'
        cmd = './a2g.py "' + h + '" > ' + x
	print cmd
        os.system(cmd)
