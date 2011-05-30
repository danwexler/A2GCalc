// Copyright (c) 2011 by Daniel Wexler -- All Rights Reserved
// UC A-G GPA Calculator
var A2GCourse = function (spec) {
  var that = {
    grade: spec.grade,
    term: spec.term,
    year: spec.year,
    xnode: spec.xnode };
  
  that.transcript_name = function () {
    return get_xnode_text(that.xnode, 'transcript_name');
  };
  
  that.colored_name = function () {
    var text = '<span style="color:';
    if (that.extra_point()) {
      text += '#00A000';
    } else if (that.grade === 'D' || that.grade === 'F') {
      text += '#A00000';
    } else {
      text += 'black';
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
    if (get_xnode_text(that.xnode, 'g_valid') === '1') {
        return true;
    }
    return false;
  };
    
  return that;
};

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

var A2GCourseList = function () {
  var that = {};
  var a2g_course = [[], [], [], [], [], [], [], []];
  var a2g_category = ["(a) History", "(b) English", "(c) Mathematics",
                      "(d) Science", "(e) Language", "(f) Arts",
                      "(g) Elective", "Unused" ];
  var a2g_required = [4, 8, 6, 4, 4, 2, 2, 0];
  var cur_curriculum;
 
  //
  // Private Methods
  //
  
  function display_error(text) {
    var err = document.getElementById('class_error');
    err.innerHTML = '&nbsp;' + text;
  }
  
  function find_course_index(term, xnode) {
    var i, j;
    for (i = 0; i < a2g_course.length; ++i) {
      for (j = 0; j < a2g_course[i].length; ++j) {
        if (a2g_course[i][j] &&
            term === a2g_course[i][j].term &&
            xnode === a2g_course[i][j].xnode) {
          return i;
        }
      }
    }
    return -1;
  }
        
  function display_a2g_course(c, r, course) {
    var name, grade, rem;
    var name_text, grade_text, rem_text;
    if (course) {
      name_text = course.colored_name();
      grade_text = course.grade + '&nbsp;';
      rem_text = '<a href="javascript:GPACalc.remove_course('
        + c + ',' + r + ');"><img src="trashcan.gif" border=0></a>';
    } else {
      name_text = "&nbsp;";
      grade_text = "&nbsp;";
      rem_text = "&nbsp;";
    }
    name = document.getElementById('c-' + c + '-' + r);
    grade = document.getElementById('g-' + c + '-' + r);
    rem = document.getElementById('r-' + c + '-' + r);
    name.innerHTML = name_text;
    grade.innerHTML = grade_text;
    rem.innerHTML = rem_text;
  }
  
  function get_valid_course_count(c) {
    var i, n;
    n = 0;
    for (i = 0; i < a2g_required[c]; ++i) {
      if (a2g_course[c][i]) {
        n++;
      }
    }
    return n;
  }

  function compute_best_category(course) {
    var c = course.category();
    var n = get_valid_course_count(c);
    if (n >= a2g_required[c] && course.g_valid()) {
      return 6;
    }
    return c;
  }

  function get_xml_filename() {
    var school_name = document.getElementById('school_name').value;
    var year = document.getElementById('year').value;
    var xml_file = "courselists/" + school_name + "-" + year + ".xml";
    while (xml_file.indexOf(" ") !== -1) {
      xml_file = xml_file.replace(" ", "-");
    }
    xml_file = xml_file.toLowerCase();
    return xml_file;
  }

  function find_course_xnode(full_name) {
    var i;
    var x = cur_curriculum.getElementsByTagName("uc_class");
    for (i = 0; i < x.length; ++i) { 
      if (get_xnode_text(x[i], 'full_name') === full_name) {
        return x[i];
      }
    }
  }

  function get_grade_value() {
    var i;
    var grade = document.getElementsByName('grade');
    for (i = 0; i < grade.length; i++) {
      if (grade[i].checked) {
        return grade[i].value;
      }
    }
  }

  function letter_grade_to_value(grade) {
    if (grade === "A") return 4.0;
    if (grade === "B") return 3.0;
    if (grade === "C") return 2.0;
    if (grade === "D") return 1.0;
    if (grade === "F") return 0.0;
  }

  function recompute_gpa() {
    var c, r, gpaoutput, n = 0, gpa = 0;
    for (c = 0; c < a2g_course.length; ++c) {
      for (r = 0; r < a2g_course[c].length; ++r, ++n) {
        if (a2g_course[c][r]) {
          gpa += letter_grade_to_value(a2g_course[c][r].grade);
          if (a2g_course[c][r].extra_point()) {
            gpa += 1;
          }
        }
      }
    }
    gpa /= n;
    gpaoutput = document.getElementById('gpa');
    gpa = Math.round(gpa * Math.pow(10, 2)) / Math.pow(10, 2);
    gpaoutput.innerHTML = gpa;
  }
  
  function display_category(c) {
    var i;
    document.writeln("<table cellspacing=0>");
    document.writeln("<tr bgcolor=#BBBB99><td colspan=3 align=center><b>" +
                   a2g_category[c] + "</b></td></tr>");
    for (i = 0; i < a2g_category.length; ++i) {
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
      document.writeln('<td width=164 id="c-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('<td width=16 id="g-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('<td width=16 id="r-' + c + '-' + i + '">&nbsp;</td>');
      document.writeln('</tr>');
    }
    document.writeln("</table>");
  }

  //
  // Public Interface
  //
  
  var update_curriculum = function () {
    var x, i;
    var xml_filename = get_xml_filename();
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
    update_curriculum();
  };
  
  var add_course = function () {
    var name = document.getElementById('course_name').value;
    var grade = get_grade_value();
    var term = document.getElementById('term').value;
    var year = document.getElementById('year').value;
    var xnode = find_course_xnode(name);
    var course = A2GCourse({'grade': grade, 'term': term, 'year': year, 'xnode': xnode});
    var c = compute_best_category(course);
    var orig_valid_course_count = get_valid_course_count(c);
    var i, r;
    if (!xnode) {
      display_error("Cannot find course " + name);
      return false;
    }
    if (find_course_index(term, xnode) >= 0) {
      display_error("Course " + name + " in term " +
                    course.term + " already exists.");
      return false;
    }
    r = -1;
    if (course.grade == 'D' || course.grade == 'F') {
      if (a2g_course[c].length > a2g_required[c]) {
        r = a2g_course[c].length;
      } else {
        r = a2g_required[c];
      }
    } else {
      for (i = 0; i < a2g_course[c].length; ++i) {
        if (!a2g_course[c][i]) {
          r = i;
          break;
        }
      }
      if (i == a2g_course[c].length) {
        r = a2g_course[c].length;
      }
    }
    a2g_course[c][r] = course;
    display_a2g_course(c, r, course);
    i = get_valid_course_count(c);
    if (i > orig_valid_course_count && i >= a2g_required[c]) {
      for (i = 0; i < a2g_required[c]; ++i) {
        r = document.getElementById('b-' + c + '-' + i);
        if (i % 2) {
          r.className = 'light_green_background';
        } else {
          r.className = 'dark_green_background';
        }
      }
    } 
    recompute_gpa();
    display_error("");
    return true;
  };
  that.add_course = add_course;
  
  var remove_course = function (c, r) {
    var orig_valid_course_count = get_valid_course_count(c);
    if (c >= a2g_course.length || r > a2g_course[c].length) {
      display_error("Invalid course " + c + ", " + r +
                    " specified for removal.");
      return false;
    }
    var i = find_course_index(a2g_course[c][r].term, a2g_course[c][r].xnode);
    if (i < 0) {
      display_error("Cannot find course in global list");
      return false;
    }
    a2g_course[c].splice(r, 1);
    for (i = r; i <= a2g_course[c].length; ++i) {
      display_a2g_course(c, i, a2g_course[c][i]);
    }
    i = get_valid_course_count(c);
    if (i < orig_valid_course_count && i < a2g_required[c]) {
      for (i = 0; i < a2g_required[c]; ++i) {
        r = document.getElementById('b-' + c + '-' + i);
        if (i % 2) {
          r.className = 'light_red_background';
        } else {
          r.className = 'dark_red_background';
        }
      }
    } 
    recompute_gpa();
    return true;
  };
  that.remove_course = remove_course;

  var display_transcript = function () {
    var i;
    document.writeln("<table cellspacing=0><tr>");
    for (i = 0; i < a2g_category.length; ++i) {
      document.writeln("<td>");
      display_category(i);
      document.writeln("</td>");
      if (i < a2g_category[i].length - 1 && (i + 1) % 4 === 0) {
        document.writeln("</tr><tr>");
      }
    }
    document.writeln("</table>");
  };
  that.display_transcript = display_transcript;
  
  return that;
};


var GPACalc = A2GCourseList();