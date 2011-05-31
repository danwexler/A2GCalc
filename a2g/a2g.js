// Copyright (c) 2011 by Daniel Wexler -- All Rights Reserved

// UC A-G GPA Calculator
//
// Enter your list of official UC-approved a-g courses and have your
// GPA and requirements computed automatically.  The offical course list
// comes directly from the UC Doorways website.  Properly accounts for
// unweighted, weighted and weighted and capped GPAs, using all of the
// various rules required by the a-g system.
//
// Two classes are provided, one for each course, and another which stores
// an entire transcript of grades.  Each time a new grade is added or
// removed, the transcript completely validates the new set of courses,
// displaying the values on the web page with various decorations to indicate
// the status of each a-g category, and any modifiers which affect the GPA
// calculation for a given class.

//
// Global Utility Functions
//

function load_xml_doc(dname) {
  var xhttp;
  if (window.XMLHttpRequest) {
    xhttp = new XMLHttpRequest();
  } else {
    xhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  xhttp.open("GET", dname, false);
  xhttp.send();
  return xhttp.responseXML;
}

function get_xnode_text(c, f) {
  var i;
  for (i = 0; i < c.childNodes.length; i++) {
    if (c.childNodes[i].nodeName === f) {
      return c.childNodes[i].textContent;
    }
  }
  return 'unknown';
}

// Simple drop-down menus
var timeout = 500;
var closetimer  = 0;
var ddmenuitem  = 0;

function mopen(id) { 
  mcancelclosetime();
  if (ddmenuitem) { // close old layer
    ddmenuitem.style.visibility = 'hidden';
  }
  // get new layer and show it
  ddmenuitem = document.getElementById(id);
  ddmenuitem.style.visibility = 'visible';
}

// close showed layer
function mclose() {
  if(ddmenuitem) {
    ddmenuitem.style.visibility = 'hidden';
  }
}

// go close timer
function mclosetime() {
  closetimer = window.setTimeout(mclose, timeout);
}

// cancel close timer
function mcancelclosetime() {
  if (closetimer) {
    window.clearTimeout(closetimer);
    closetimer = null;
  }
}

// close layer when click-out
document.onclick = mclose;

//
// A2GCourse Class
//

var A2GCourse = function (spec) {
  var that = {
    grade: spec.grade,
    term: spec.term,
    year: spec.year,
    xnode: spec.xnode,
    drawn: false
  };
  
  that.transcript_name = function () {
    return get_xnode_text(that.xnode, 'transcript_name');
  };
  
  that.decorated_name = function (ignored) {
    var text = '<span class="';
    if (ignored) {
      text += 'ignored_course_text';
    } else if (that.extra_point()) {
      text += 'extra_point_course_text';
    } else if (that.grade === 'D' || that.grade === 'F') {
      text += 'failed_course_text';
    } else {
      text += 'standard_course_text';
    }
    text += '">' + that.transcript_name() + '</span>';
    return text;
  };
  
  that.full_name = function () {
    return get_xnode_text(that.xnode, 'full_name');
  };
  
  that.category = function () {
    return parseInt(get_xnode_text(that.xnode, 'a2g_category'));
  };
  
  that.extra_point = function () {
    if (that.grade !== 'D' && that.grade !== 'F' &&
        get_xnode_text(that.xnode, 'extra_point') === '1') {
      return true;
    }
    return false;
  };
  
  that.g_valid = function () {
    if (that.grade === 'D' || that.grade === 'F') {
      return false;
    }
    if (that.category() === 6) {
      return true;
    }
    if (get_xnode_text(that.xnode, 'g_valid') === '1') {
      return true;
    }
    return false;
  };
    
  return that;
};

//
// A2GTranscript Class
//
var A2GTranscript = function () {
  var that = {};
  var a2g_course = [[], [], [], [], [], [], [], []];
  var a2g_category = ["(a) History", "(b) English", "(c) Mathematics",
                      "(d) Science", "(e) Language", "(f) Arts",
                      "(g) Elective", "Unused" ];
  var a2g_required = [4, 8, 6, 4, 4, 2, 2, 0];
  var a2g_max_semesters = 10;
  var freshman_year, school_name;
  var curriculum = [[], [], [], []];
  var last_set_term, last_set_year, last_set_grade;
 
  //
  // Private Methods
  //
  
  function display_error(text) {
    var err = document.getElementById('class_error');
    err.innerHTML = '&nbsp;' + text;
  }
  
  function find_course_index(c, course) {
    var i;
    for (i = 0; i < a2g_course[c].length; ++i) {
      if (a2g_course[c][i] == course) {
        return i;
      }
    }
    return -1;
  }
  
  function find_xnode_pass_count(xnode) {
    var i, n = 0;
    for (i = 0; i < a2g_course.length; ++i) {
      if (xnode === a2g_course[i].xnode &&
          !(a2g_course[i].grade === 'D' || a2g_course[i].grade === 'F')) {
        n++;
      }
    }
    return n;
  }

  function find_curriculum_xnode(full_name, year) {
    var i, x = curriculum[year].getElementsByTagName("uc_class");
    for (i = 0; i < x.length; ++i) { 
      if (get_xnode_text(x[i], 'full_name') === full_name) {
        return x[i];
      }
    }
  }

  function letter_grade_to_value(grade) {
    if (grade === "A") {
      return 4.0;
    } else if (grade === "B") {
      return 3.0;
    } else if (grade === "C") {
      return 2.0;
    } else if (grade === "D") {
      return 1.0;
    } else if (grade === "F") {
      return 0.0;
    }
  }

  function get_document_grade_value() {
    var i;
    var grade = document.getElementsByName('grade');
    for (i = 0; i < grade.length; i++) {
      if (grade[i].checked) {
        return grade[i].value;
      }
    }
  }

  function is_repeated(course) {
    var i;
    if (course.grade !== 'D' && course.grade !== 'F') {
      return false;
    }
    for (i = 0; i < a2g_course.length; ++i) {
      if (course !== a2g_course[i] &&
          a2g_course[i].xnode === course.xnode &&
          a2g_course[i].year === course.year &&
          a2g_course[i].term > course.term) {
        return true;
      }
    }
    return false;
  }
  
  function generate_menu_head_html(title, id) {
    var t = '<ul id="sddm2"><li><a href="#" onmouseover="mopen(\'m' + id +
            '\')" onmouseout="mclosetime()">' + title + 
            '<img src="icon_down_arrow.gif" border=0></a>' +
            '<div id="m' + id + '" onmouseover="mcancelclosetime()" ' +
            'onmouseout="mclosetime()">';
    return t;
  }
  
  function generate_menu_foot_html() {
    var t = '</div><li><div style="clear:both"></div>';
    return t;
  }
  
  function display_a2g_course(c, r, course) {
    var name, grade, term, rem;
    var name_text, grade_text, term_text, rem_text;
    var term_menu_text, grade_menu_text;
    var y, t, idx = -1, ignored = false;
    var a_f_grade = ['A', 'B', 'C', 'D', 'F'];
    if (course) {
      if (course.year <= freshman_year || is_repeated(course)) {
        ignored = true;
      }
      idx = find_course_index(c, course);
      name_text = course.decorated_name(ignored);
      grade_text = course.grade;
      y = c * a2g_max_semesters + r + 100;
      grade_menu_text = generate_menu_head_html(grade_text, y);
      for (y = 0; y < 5; ++y) {
        grade_menu_text += '<a href="javascript:GPACalc.set_grade(' +
        c + ', ' + idx + ', \'' + a_f_grade[y] + '\');">' +
        a_f_grade[y] + '</a>\n';
      }
      grade_menu_text += generate_menu_foot_html();
      term_text = 'T' + course.term + " '" + String(course.year).substr(2,2);
      y = c * a2g_max_semesters + r + 1000;
      term_menu_text = generate_menu_head_html(term_text, y);
      for (y = 0; y < 4; ++y) {
        for (t = 1; t < 5; ++t) {
          term_menu_text += '<a href="javascript:GPACalc.set_date(' +
            c + ', ' + idx + ', ' + t + ', ' + y + ');">' +
            'T' + t + ',&nbsp;' + (freshman_year + y) + '</a>\n';
        }
      }
      term_menu_text += generate_menu_foot_html();
      rem_text = '<a href="javascript:GPACalc.remove_course(' + c + ', ' + idx +
        ');"><img src="trashcan.gif" border=0></a>';
    } else {
      name_text = "&nbsp;";
      grade_menu_text = "&nbsp;";
      term_menu_text = '&nbsp;';
      rem_text = "&nbsp;";
    }
    name = document.getElementById('c-' + c + '-' + r);
    grade = document.getElementById('g-' + c + '-' + r);
    term = document.getElementById('t-' + c + '-' + r);
    rem = document.getElementById('r-' + c + '-' + r);
    name.innerHTML = name_text;
    grade.innerHTML = grade_menu_text;
    term.innerHTML = term_menu_text;
    rem.innerHTML = rem_text;
    return ignored;
  }

  function display_a2g_category(c, light_background, dark_background) {
    var i, r;
    for (i = 0; i < a2g_required[c]; ++i) {
      r = document.getElementById('b-' + c + '-' + i);
      if (i % 2) {
        r.className = light_background;
      } else {
        r.className = dark_background;
      }
    }
  }
  
  function display_gpa(gpa, gpa_course_count) {
    var gpa_element = document.getElementById('weighted_gpa');
    if (gpa_course_count > 0) {
      gpa /= gpa_course_count;
    } else {
      gpa = 0;
    }
    gpa = Math.round(gpa * Math.pow(10, 2)) / Math.pow(10, 2);
    gpa_element.innerHTML = gpa;
  }
  
  function display_all_courses() {
    var i, j, c, r, course, ignored, gpa = 0, gpa_course_count = 0;
    
    function drawn_course_count(c) {
      var i, n = 0;
      for (i = 0; i < a2g_course[c].length; ++i) {
        if (a2g_course[c][i].drawn) {
          n++;
        }
      }
      return n;
    }
    
    function satisfies_category(course, c) {
      if (drawn_course_count(c) > a2g_required[c]) {
        return false;   // can't satisfy -- already filled
      }
      if (course.grade === 'D' || course.grade === 'F') {
        return false;   // can't satisfy -- not passing
      }
      if (course.category() !== c && c !== 6) {  // elective
        return false;
      }
      switch (c) {
      case 0:   // history - 2 years required
        // Two years of history/social science, including one year of World
        // History, Cultures or Geography; and one year of US History or
        // one-half year of US History and one-half year of American
        // Government/Civics.
        return true;
      case 1:   // english - 4 years required
        // Four years of college preparatory English. Students may only use 1
        // year of ESL/ELD English.
        return true;
      case 2:   // math - 3 years required, 4 years recommended
        // Three years of college preparatory mathematics that includes the
        // topics covered in Elementary Algebra/Algebra 1, Geometry and Advanced
        // Algebra/Algebra 2. Approved Integrated Math courses may be used to
        // fulfill part or all of this requirement. break;
        return true;
      case 3:   // science - 2 years required, 3 years recommended
        // Two years of laboratory science, including two of the three
        // fundamental disciplines of Biology, Chemistry and Physics. This
        // requirement can also be met by completing the latter two years of a
        // 3-year Integrated Science program.
        return true;
      case 4:   // language - 2 years required, 3 years recommended
        // Two years of the same language other than English.
        return true;
      case 5:   // art - 1 year required
        return true;
      case 6:   // elective - 1 year required
        // One year (two semesters), in addition to those required in "a-f"
        // above. All courses must be listed under "a-f" above with the
        // exception of courses marked with a blue diamond () in Mathematics,
        // Language Other than English, and VPA; plus any elective course.
        if (course.g_valid()) {
          return true;
        }
        return true;
      case 7:   // unused
        return true;
      }
      return false;
    }
    
    function get_best_course_index(c) {
      var i;
      for (i = 0; i < a2g_course[c].length; ++i) {
        if (!a2g_course[c][i].drawn &&
            satisfies_category(a2g_course[c][i], c)) {
          return i;
        }
      }
      return -1;
    }
    
    function incr_gpa(course) {
      if (!course) {
        return;
      }
      gpa_course_count++;
      gpa += letter_grade_to_value(course.grade);
      if (course.extra_point()) {
        gpa += 1;
      }
    }

    gpa = 0;
    gpa_course_count = 0;
    
    for (c = 0; c < a2g_category.length; ++c) {
      // Clear the drawn bit for each course
      for (i = 0; i < a2g_course[c].length; ++i) {
        a2g_course[c][i].drawn = false;
      }
    
      // pick out the first courses that match each category
      // until we run out or satisfy that category's requirements.
      for (j = 0, r = 0; r < a2g_required[c]; ++r) {
        i = get_best_course_index(c);
        if (i < 0) {
          break;
        }
        ignored = display_a2g_course(c, j++, a2g_course[c][i]);
        if (!ignored) {
          incr_gpa(a2g_course[c][i]);
        }
        a2g_course[c][i].drawn = true;
      }
      
      if (j >= a2g_required[c]) {
        display_a2g_category(c, 'light_green_background',
                             'dark_green_background');
      } else {
        display_a2g_category(c, 'light_red_background',
                             'dark_red_background');
      }
      
      while (j < a2g_required[c]) {
        display_a2g_course(c, j++, undefined);
      }

      // run through again, drawing any remaining classes
      for (i = 0; i < a2g_course[c].length; ++i) {
        if (!a2g_course[c][i].drawn) {
          ignored = display_a2g_course(c, j++, a2g_course[c][i]);
          if (!ignored) {
            incr_gpa(a2g_course[c][i]);
          }
          a2g_course[c][i].drawn = true;
        }
      }
      
      while (j < a2g_max_semesters) {
        display_a2g_course(c, j++, undefined);
      }
    }

    display_gpa(gpa, gpa_course_count);
  }
  
  function document_write_category(c) {
    var i;
    document.writeln('<table cellspacing=0>');
    document.writeln('<tr class="a2g_category_heading">' +
                     '<td colspan=4 align=cente id="ch-' + c + '">' +
                     '<ul id="sddm">' +
                     '<li><a href="#" onmouseover="mopen(\'m' +
                     c + '\')" onmouseout="mclosetime()">' +
                     a2g_category[c] + '</a>' +
                     '<div id="m' + c + '"' +
                     'onmouseover="mcancelclosetime()"' +
                     'onmouseout="mclosetime()">' +
                     '</div></li></ul></td></tr>');
    for (i = 0; i < a2g_max_semesters; ++i) {
      document.write('<tr class="');
      if (i < a2g_required[c]) {
        if (i % 2) {
          document.write('light_red_background');
        } else {
          document.write('dark_red_background');
        }
      } else {
        if (i % 2) {
          document.write('light_gray_background');
        } else {
          document.write('dark_gray_background');
        }
      }
      document.write('" id="b-' + c + '-' + i + '">');
      document.writeln('<td class="course_text" width=120 height=24 id="c-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('<td width=64 id="t-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('<td width=40 id="g-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('<td width=16 id="r-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('</tr>');
    }
    document.writeln('</table>');
  }

  //
  // Public Interface
  //
  
  function get_document_curriculum_filename() {
    return filename;
  }

  var update_curriculum = function () {
    var school_name = document.getElementById('school_name').value;
    var i, j, c, cc, gv, fn, x, category_menu, li, lit, filename;
    display_error("");
    freshman_year = parseInt(document.getElementById('freshman_year').value);
    last_set_year = freshman_year;
    last_set_term = 1;
    last_set_grade = 'C';
    for (i = 0; i < 4; ++i) {
      filename = "courselists/" + school_name + "-" + (freshman_year + i) + ".xml";
      while (filename.indexOf(" ") !== -1) {
        filename = filename.replace(" ", "-");
      }
      filename = filename.toLowerCase();
      curriculum[i] = load_xml_doc(filename);
      if (! curriculum[i] && i > 0) {
        display_error("Cannot find curriculum for " + (freshman_year + i) + ", using prior year.");
        curriculum[i] = curriculum[i-1];
      }
    }
    for (c = 0; c < a2g_category.length; ++c) {
      li = '';
      for (i = 0; i < 4; ++i) {
        x = curriculum[i].getElementsByTagName("uc_class");
        for (j = 0; j < x.length; ++j) {
          cc = parseInt(get_xnode_text(x[j], 'a2g_category'));
          gv = get_xnode_text(x[j], 'g_valid') === '1';
          fn = get_xnode_text(x[j], 'full_name');
          if ((cc === c || (c === 6 && gv)) && li.indexOf(fn) === -1) {
            lit = '<a href="javascript:GPACalc.add_course(' +
              c + ', ' + i + ', ' + j + ', \'' + fn + '\')">' + fn + '</a>\n';
            li += lit;
          }
        }
      }
      category_menu = document.getElementById('ch-' + c).childNodes[0];
      category_menu.childNodes[0].childNodes[1].innerHTML = li;
    }
    display_all_courses();
  };
  that.update_curriculum = update_curriculum;
  
  that.init = function () {
    update_curriculum();
  };
  
  var add_course = function (c, i, j, name) {
    var grade = last_set_grade;
    var term = last_set_term;
    var year = last_set_year;
    var xnode = find_curriculum_xnode(name, last_set_year - freshman_year);
    var course = A2GCourse({
      'grade': grade,
      'term': term,
      'year': year,
      'xnode': xnode
    });
    display_error("");
    if (!xnode) {
      display_error('Cannot find course ' + name);
      return false;
    }
    if (find_xnode_pass_count(xnode) > 1) {
      display_error(name + ' already taken for a full year.');
      return false;
    }
    a2g_course[c].push(course);
    display_all_courses();
    return true;
  };
  that.add_course = add_course;
  
  var remove_course = function (c, i) {
    display_error("");
    if (c < 0 || c >= a2g_category.length) {
      display_error('Invalid course category #' + c + ' specified for removal.');
      return false;
    }
    if (i < 0 || i >= a2g_course[c].length) {
      display_error('Invalid course index #' + i + ' specified for removal.');
      return false;
    }
    a2g_course[c].splice(i, 1);
    display_all_courses();
    return true;
  };
  that.remove_course = remove_course;

  var set_date = function (c, i, term, year) {
    display_error("");
    if (c < 0 || c >= a2g_category.length) {
      display_error('Invalid course category #' + c + ' specified for setting date.');
      return false;
    }
    if (i < 0 || i >= a2g_course[c].length) {
      display_error('Invalid course index #' + i + ' specified for setting date.');
      return false;
    }
    last_set_year = freshman_year + year;
    last_set_term = term;
    a2g_course[c][i].year = last_set_year;
    a2g_course[c][i].term = last_set_term;
    display_all_courses();
  };
  that.set_date = set_date;

  var set_grade = function (c, i, grade) {
    display_error("");
    if (c < 0 || c >= a2g_category.length) {
      display_error('Invalid course category #' + c + ' specified for setting date.');
      return false;
    }
    if (i < 0 || i >= a2g_course[c].length) {
      display_error('Invalid course index #' + i + ' specified for setting date.');
      return false;
    }
    a2g_course[c][i].grade = grade;
    last_set_grade = grade;
    display_all_courses();
  };
  that.set_grade = set_grade;

  var document_write_transcript = function () {
    var i;
    document.writeln("<table cellspacing=0><tr>");
    for (i = 0; i < a2g_category.length; ++i) {
      document.writeln("<td>");
      document_write_category(i);
      document.writeln("</td>");
      if (i < a2g_category[i].length - 1 && (i + 1) % 4 === 0) {
        document.writeln("</tr><tr>");
      }
    }
    document.writeln("</table>");
  };
  that.document_write_transcript = document_write_transcript;
  
  return that;
};

//
// A single global A2GTranscript variable to store the entire app.
// Only the public interface methods may be used in the HTML code.
//
var GPACalc = A2GTranscript();