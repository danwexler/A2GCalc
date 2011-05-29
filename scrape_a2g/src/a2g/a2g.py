#!/usr/bin/python2.6

'''
Created on May 25, 2011

@author: wex
'''

import sys
import urllib2
from BeautifulSoup import BeautifulSoup


if __name__ == '__main__':
    url = 'file:///home/wex/src/a2g/tt.html'
    if len(sys.argv) > 1:
        url = sys.argv[1]
    page = urllib2.urlopen(url)
    soup = BeautifulSoup(page)
    subjects = soup.findAll('span', { "class" : "courseListSubject" })
    tables = soup.findAll('table', {"class" : "courseListTable"})
    if len(subjects) != len(tables):
        print 'Error: Unequal number of subjects (' + len(subjects) + ') and tables (' + len(tables) + ')'
        quit();
    print '<?xml version="1.0" encoding="ISO-8859-1"?>'
    print '<uc_curriculum>'

    for i in range(len(subjects)):
        courseList = tables[i]
        subject = subjects[i]
        courses = courseList.findAll('tr')
        for course in courses:
            title = course.find('td', {"class" : "courseListColumn courseListTitleColumn"})
            if title:
                extra_point = 0;
                g_valid = 1; 
                images = title.findAll('img')
                for img in images:
                    print img.src
                    if img['src'].find('goldstar') >= 0:
                        extra_point = 1
                    if img['src'].find('bluediamond') >= 0:
                        g_valid = 0
                abbr = course.find('td', {"class" : "courseListColumn courseListAbbrevsColumn"})
                if title.string:
                    full_name = title.string
                else:
                    full_name = title.contents[0].string
                full_name = full_name.replace('&nbsp;', ' ').replace('\n','').lstrip().rstrip()
                transcript_name = abbr.string.replace(' ', '').replace('&nbsp;', '').replace('\n','')
                print '<uc_class>'
                print '    <full_name>' + full_name + '</full_name>'
                print '    <transcript_name>' + transcript_name + '</transcript_name>'
                print '    <a2g_category>' + str(i) + '</a2g_category>'
                print '    <extra_point>' + str(int(extra_point)) + '</extra_point>'
                print '    <g_valid>' + str(int(g_valid)) + '</g_valid>'
                print '    <prerequisite>0</prerequisite>'
                print '</uc_class>'
    
    print
    print '</uc_curriculum>'
            
