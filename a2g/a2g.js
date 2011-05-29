// UC A-G GPA Calculator

// Globals

const category_count = 8;
const uc_class_required_count = [4, 8, 6, 4, 4, 2, 2, 0];
var uc_class_count = [0, 0, 0, 0, 0, 0, 0, 0];
var uc_class = new Array();
for (i = 0; i < category_count; ++i) {
  uc_class[i] = new Array();
}



// XML Helpers

function load_xml_doc(dname) {
  if (window.XMLHttpRequest) {
    xhttp=new XMLHttpRequest();
  } else {
    xhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xhttp.open("GET", dname, false);
  xhttp.send();
  return xhttp.responseXML;
}

function get_xml_filename() {
  var school_name = document.getElementById('school_name');
  var year = document.getElementById('year');
  var xml_file = "courselists/" + school_name.value + "-" + year.value + ".xml";
  while (xml_file.indexOf(" ") != -1) {
    xml_file = xml_file.replace(" ", "-");
  }
  xml_file = xml_file.toLowerCase();
  return xml_file;
}

function get_xml_node_text(c, f) {
  for (var i = 0; i < c.childNodes.length; ++i) {
    if (c.childNodes[i].nodeName == f)
      return c.childNodes[i].textContent;
  }
  return 'unknown';
}

function find_xml_uc_class(full_name) {
  var x = xml_curriculum.getElementsByTagName("uc_class");
  for (var i = 0; i < x.length; ++i) { 
    if (get_xml_node_text(x[i], 'full_name') == full_name) {
      return x[i];
    }
  }
}



// Transcript Management

function get_grade_value() {
  var grade = document.getElementsByName('grade');
  for (var i = 0; i < grade.length; i++) {
    if (grade[i].checked) {
      return grade[i].value;
    }
  }
}

function update_class_selector() {
  var xml_filename = get_xml_filename();
  xml_curriculum = load_xml_doc(xml_filename);
  var classname = document.getElementById('classname');
  classname.options.length = 0;
  var x = xml_curriculum.getElementsByTagName("uc_class");
  for (var i = 0; i < x.length; ++i) { 
    classname.options[i] = new Option(get_xml_node_text(x[i], 'full_name'));
  }  
}

function create_class(name, grade, term) {
  var o = new Object();
  o.grade = grade;
  o.term = term;
  o.xml_node = find_xml_uc_class(classname.options[classname.selectedIndex].value);;
  return o;
}

function letter_grade_to_value(grade) {
  if (grade == "A") return 4.0;
  if (grade == "B") return 3.0;
  if (grade == "C") return 2.0;
  if (grade == "D") return 1.0;
  if (grade == "F") return 0.0;
}

function recompute_gpa() {
  var n = 0;
  var gpa = 0;
  for (c = 0; c < category_count; ++c) {
    for (r = 0; r < uc_class_count[c]; ++r, ++n) {
      gpa += letter_grade_to_value(uc_class[c][r].grade);
    }
  }
  gpa /= n;
  var gpaoutput = document.getElementById('gpa');
  gpa = Math.round(gpa*Math.pow(10,2))/Math.pow(10,2);
  gpaoutput.innerHTML = gpa;
}

function set_uc_class(c, r, cl) {
  uc_class[c][r] = cl;
  var name = document.getElementById('c-' + c + '-' + r);
  name.innerHTML = get_xml_node_text(cl.xml_node, 'transcript_name');
  var grade = document.getElementById('g-' + c + '-' + r);
  grade.innerHTML = cl.grade + '&nbsp;';
  var rem = document.getElementById('r-' + c + '-' + r);
  rem.innerHTML = '<a href="javascript:remove_uc_class(' + c + ',' + r + ');"><img src="trashcan.gif" border=0></a>';
}

function add_uc_class(c, r, cl) {
  uc_class_count[c] += 1;
  set_uc_class(c, r, cl);
  recompute_gpa();
}

function remove_uc_class(c, r) {
  // Move any classes in this category below the removed class up one slot
  for (var i = r; i < uc_class_count[c] - 1; ++i) {
    set_uc_class(c, i, uc_class[c][i+1]);
  }
  uc_class_count[c] -= 1;
  var k = uc_class_count[c];
  uc_class[c][k] = undefined;
  var name = document.getElementById('c-' + c + '-' + k);
  name.innerHTML = "&nbsp;";
  var grade = document.getElementById('g-' + c + '-' + k);
  grade.innerHTML = "&nbsp;";
  var rem = document.getElementById('r-' + c + '-' + k);
  rem.innerHTML = "&nbsp";  
  recompute_gpa();
}

function compute_best_category(cl) {
  var c = get_xml_node_text(cl.xml_node, 'a2g_category');
  if (uc_class_count[c] >= uc_class_required_count[c] &&
      get_xml_node_text(cl.xml_node, 'g_valid')) {
    return 6;
  }
  return c;
}

function add_class() {
  var classname = document.getElementById('classname');
  var grade = get_grade_value();
  var term = document.getElementById('term');
  var cl = create_class(classname, grade, term);
  var c = compute_best_category(cl);
  var r = uc_class_count[c];
  add_uc_class(c, r, cl);
}

function init() {
  update_class_selector();
}



// Display functions, called before initialization

function display_category(c) {
  var a2g_category = ["(a) History", "(b) English", "(c) Mathematics", "(d) Science",
                      "(e) Language", "(f) Arts", "(g) Elective", "Unused" ];
  document.write("<table cellspacing=0>");
  document.write("<tr bgcolor=#BBBB99><td colspan=3 align=center><b>" + a2g_category[c] + "</b></td></tr>");
  for (var i=0; i < 8; ++i) {
    document.write("<tr bgcolor=");
    if (i < uc_class_required_count[c]) {
      if (i % 2) {
        document.write('"#FEEEEE"');
      } else {
        document.write('"#EDDDDD"');
      }
    } else {
      if (i % 2) {
        document.write('"#EEEEEE"');
      } else {
        document.write('"#DDDDDD"');
      }
    }
    document.write('><td width=164 id="c-' + c + '-' + i + '">&nbsp;</td>');
    document.write('<td width=16 id="g-' + c + '-' + i + '">&nbsp;</td>');
    document.write('<td width=16 id="r-' + c + '-' + i + '">&nbsp;</td></tr>');
  }
  document.write("</table>");
}

function display_transcript() {
  document.write("<table cellspacing=0><tr>");
  for (var i = 0; i < category_count; ++i) {
    document.write("<td>");
    display_category(i);
    document.write("</td>");
    if (i < category_count - 1 && (i + 1) % 4 == 0) {
      document.write("</tr><tr>");
    }
  }
  document.write("</table>");
}
