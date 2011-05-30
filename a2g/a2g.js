// Copyright (c) 2011 by Daniel Wexler -- All Rights Reserved
// UC A-G GPA Calculator
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

var A2GCourse = function (spec) {
  var that = {
    grade: spec.grade,
    term: spec.term,
    year: spec.year,
    xnode: spec.xnode
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
    return get_xnode_text(that.xnode, 'a2g_category');
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
    if (that.category() === '6') {
      return true;
    }
    if (get_xnode_text(that.xnode, 'g_valid') === '1') {
      return true;
    }
    return false;
  };
    
  return that;
};

var A2GCourseList = function () {
  var that = {};
  var course_list = [];
  var a2g_category = ["(a) History", "(b) English", "(c) Mathematics",
                      "(d) Science", "(e) Language", "(f) Arts",
                      "(g) Elective", "Unused" ];
  var a2g_required = [4, 8, 6, 4, 4, 2, 2, 0];
  var a2g_max_semesters = 10;
  var freshman_year;
  var cur_curriculum;
 
  //
  // Private Methods
  //
  
  function display_error(text) {
    var err = document.getElementById('class_error');
    err.innerHTML = '&nbsp;' + text;
  }
  
  function find_course_index(term, year, xnode) {
    var i;
    for (i = 0; i < course_list.length; ++i) {
      if (course_list[i] &&
          term === course_list[i].term &&
          year === course_list[i].year &&
          xnode === course_list[i].xnode) {
        return i;
      }
    }
    return -1;
  }
  
  function find_xnode_count(xnode) {
    var i, n = 0;
    for (i = 0; i < course_list.length; ++i) {
      if (xnode === course_list[i].xnode) {
        n++;
      }
    }
    return n;
  }

  function find_curriculum_xnode(full_name) {
    var i;
    var x = cur_curriculum.getElementsByTagName("uc_class");
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

  function get_document_curriculum_filename() {
    var school_name = document.getElementById('school_name').value;
    var year = document.getElementById('year').value;
    var xml_file = "courselists/" + school_name + "-" + year + ".xml";
    while (xml_file.indexOf(" ") !== -1) {
      xml_file = xml_file.replace(" ", "-");
    }
    xml_file = xml_file.toLowerCase();
    return xml_file;
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
    for (i = 0; i < course_list.length; ++i) {
      if (course != course_list[i] &&
          course_list[i].xnode === course.xnode &&
          course_list[i].year === course.year &&
          course_list[i].term > course.term) {
        return true;
      }
    }
    return false;
  }
    
  function display_a2g_course(c, r, course) {
    var name, grade, term, rem;
    var name_text, grade_text, term_text, rem_text;
    var i, idx = -1, ignored = false;
    if (course) {
      if (course.year === freshman_year || is_repeated(course)) {
        ignored = true;
      }
      name_text = course.decorated_name(ignored);
      grade_text = course.grade + '&nbsp;';
      term_text = course.term + '/' + (course.year - 2000);
      idx = find_course_index(course.term, course.year, course.xnode);
      rem_text = '<a href="javascript:GPACalc.remove_course(' + idx +
        ');"><img src="trashcan.gif" border=0></a>';
    } else {
      name_text = "&nbsp;";
      grade_text = "&nbsp;";
      term_text = '&nbsp;';
      rem_text = "&nbsp;";
    }
    name = document.getElementById('c-' + c + '-' + r);
    grade = document.getElementById('g-' + c + '-' + r);
    term = document.getElementById('t-' + c + '-' + r);
    rem = document.getElementById('r-' + c + '-' + r);
    name.innerHTML = name_text;
    grade.innerHTML = grade_text;
    term.innerHTML = term_text;
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
    var gpa_element = document.getElementById('gpa');
    if (gpa_course_count > 0) {
      gpa /= gpa_course_count;
    } else {
      gpa = 0;
    }
    gpa = Math.round(gpa * Math.pow(10, 2)) / Math.pow(10, 2);
    gpa_element.innerHTML = gpa;
  }
  
  function display_all_courses() {
    var a2g_course = [[], [], [], [], [], [], [], []];
    var a2g_extra = [[], [], [], [], [], [], [], []];
    var tmp_all_course = course_list.concat();
    var i, c, r, course, ignored, gpa = 0, gpa_course_count = 0;
    
    function compute_best_category(course) {
      var c = course.category();
      // if primary requirement is filled, and g-valid...
      if (a2g_course[c].length >= a2g_required[c] && course.g_valid()) {
        return 6; // move to elective (g)
      }
      return c;
    }

    function satisfies_category(course, c) {
      if (a2g_course[c].length >= a2g_required[c]) {
        return false;   // can't satisfy -- already filled
      }
      if (course.grade === 'D' || course.grade === 'F') {
        return false;   // can't satisfy -- not passing
      }
      if (course.category() !== c.toString() && c !== 6) {  // elective
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
    
    function get_best_course(c) {
      var i, course;
      for (i = 0; i < tmp_all_course.length; ++i) {
        if (satisfies_category(tmp_all_course[i], c)) {
          course = tmp_all_course.splice(i, 1);
          return course[0];
        }
      }
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
    
    // pick out the first courses that match each category
    // until we run out or satisfy that category's requirements.
    for (c = 0; c < a2g_category.length; ++c) {
      for (r = 0; r < a2g_required[c]; ++r) {
        course = get_best_course(c);
        if (!course) {
          break;
        }
        a2g_course[c][r] = course;
      }
    }
    
    // distribute remaining courses to their extra categories
    for (i = 0; i < tmp_all_course.length; ++i) {
      c = tmp_all_course[i].category();
      a2g_extra[c].push(tmp_all_course[i]);
    }
    
    // now run through and display each category
    gpa = 0;
    gpa_course_count = 0;
    for (c = 0; c < a2g_category.length; ++c) {
      for (r = 0; r < a2g_required[c]; ++r) {
        ignored = display_a2g_course(c, r, a2g_course[c][r]);
        if (!ignored) {
          incr_gpa(a2g_course[c][r]);
        }
      }
      for (i = 0; i < a2g_max_semesters - a2g_required[c]; ++i) {
        ignored = display_a2g_course(c, i + a2g_required[c], a2g_extra[c][i]);
        if (!ignored) {
          incr_gpa(a2g_course[c][r]);
        }
      }
      if (a2g_course[c].length >= a2g_required[c]) {
        display_a2g_category(c, 'light_green_background',
                             'dark_green_background');
      } else {
        display_a2g_category(c, 'light_red_background', 'dark_red_background');
      }
    }
    
    display_gpa(gpa, gpa_course_count);
  }
  
  function document_write_category(c) {
    var i;
    document.writeln('<table cellspacing=0>');
    document.writeln('<tr class="a2g_category_heading">' +
                     '<td colspan=4 align=center><b>' +
                     a2g_category[c] + '</b></td></tr>');
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
      document.writeln('<td width=128 id="c-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('<td width=48 id="t-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('<td width=16 id="g-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('<td width=16 id="r-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('</tr>');
    }
    document.writeln('</table>');
  }

  //
  // Public Interface
  //
  
  var update_freshman_year = function () {
    freshman_year = document.getElementById('freshman_year').value;
    display_all_courses();
  };
  that.update_freshman_year = update_freshman_year;
  
  var update_curriculum = function () {
    var x, i;
    var xml_filename = get_document_curriculum_filename();
    var course_name = document.getElementById('course_name');
    cur_curriculum = load_xml_doc(xml_filename);
    course_name.options.length = 0;
    x = cur_curriculum.getElementsByTagName("uc_class");
    for (i = 0; i < x.length; ++i) { 
      course_name.options[i] = new Option(get_xnode_text(x[i], 'full_name'));
    }  
  };
  that.update_curriculum = update_curriculum;
  
  that.init = function () {
    update_freshman_year();
    update_curriculum();
  };
  
  var add_course = function () {
    var name = document.getElementById('course_name').value;
    var grade = get_document_grade_value();
    var term = document.getElementById('term').value;
    var year = document.getElementById('year').value;
    var xnode = find_curriculum_xnode(name);
    var course = A2GCourse({
      'grade': grade,
      'term': term,
      'year': year,
      'xnode': xnode
    });
    var i, r;
    display_error("");
    if (!xnode) {
      display_error('Cannot find course ' + name);
      return false;
    }
    if (find_course_index(term, year, xnode) >= 0) {
      display_error(name + 'already taken in term ' +
                    course.term + ' of ' + course.year + '.');
      return false;
    }
    if (find_xnode_count(xnode) > 1) {
      display_error(name + ' already taken for a full year.');
      return false;
    }
    course_list.push(course);
    display_all_courses();
    return true;
  };
  that.add_course = add_course;
  
  var remove_course = function (i) {
    display_error("");
    if (i < 0 || i > course_list.length) {
      display_error('Invalid course index #' + i + ' specified for removal.');
      return false;
    }
    course_list.splice(i, 1);
    display_all_courses();
    return true;
  };
  that.remove_course = remove_course;

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


var GPACalc = A2GCourseList();