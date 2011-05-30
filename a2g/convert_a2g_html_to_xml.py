#!/usr/bin/python2.6

import os

for s in ['tahoe-truckee-hs', 'north-tahoe-hs']:
    for i in range(2003, 2012):
        basename = 'courselists/' + s + '-' + str(i)
        h = 'file:///home/wex/src/A2GCalc/a2g/' + basename + '.html'
        x = basename + '.xml'
        cmd = '../scrape_a2g/src/a2g/a2g.py "' + h + '" > ' + x
	print cmd
        os.system(cmd)
