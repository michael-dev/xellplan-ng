var xp = { }

xp.numRow = 10;
xp.numCol = 10;
xp.defColWidth = 80;
xp.defColRound = 10;
xp.defRowHeight = 20;
xp.defRowRound = 10;
xp.containerId = 'content';
xp.colWidths = { '-1' : 30 };
xp.rowHeights = {};
xp.borderWidth = 1;
xp.paddingWidth = 2;
xp.data = {};
xp.ass = {};
xp.currentFocus = null;
xp.users = {}
xp.groups = {}
xp.pads = {};
xp.adminMode = false;
xp.currentPlanId = null;

/* 65 (A) - 90 (Z): 26 Zeichen */
xp.colName = function(i) {
  var c = '';
  i = i + 1;
  while (i > 0) {
    i--;
    var j = i % 26;
    i = (i - j ) / 26;
    c = String.fromCharCode(j + 65) + c;
  };
  return c;
}

xp.getColWidth = function(col, edit) {
  var w = 0;
  if (edit) { // firefox 16.0.1: div width := inner width, input width := inner width + padding + border
    w += 2 * xp.borderWidth + 2 * xp.paddingWidth;
  }
  if (col in xp.colWidths) {
    w += xp.colWidths[col];
  } else {
    w += xp.defColWidth;
  }
  return w;
}

xp.getColLeft = function(col) {
  var left = 0;
  for (var i = -1; i < col; i++) {
    left += xp.getColWidth(i);
    left += xp.borderWidth + 2 * xp.paddingWidth;
  }
  return left;
}

xp.getRowHeight = function(row,edit) {
  var h = 0;
  if (edit) { // firefox 16.0.1: div height := inner height, input height := inner height + padding + border
    h += 2 * xp.borderWidth + 2 * xp.paddingWidth;
  }
  if (row in xp.rowHeights) {
    h += xp.rowHeights[row];
  } else {
    h += xp.defRowHeight;
  }
  return h;
}

xp.getRowTop = function(row) {
  var fromTop = 0;
  for (var i = -1; i < row; i++) {
    fromTop += xp.getRowHeight(i);
    fromTop += xp.borderWidth + 2 * xp.paddingWidth;
  }
  return fromTop;
}

xp.getRowClass = function(row) {
  if (row == -1) {
    return 'xpCellHeader';
  } else {
    return 'xpCellRow' + row;
  }
}

xp.getColClass = function(col) {
  if (col == -1) {
    return 'xpCellNumber';
  } else {
    return 'xpCellColumn' + col;
  }
}

xp.getCellId = function(col, row, edit) {
  if (row == -1) {
    return xp.containerId + (edit ? '_edit' : '') + '_header' + col;
  } else {
    return xp.containerId + (edit ? '_edit' : '') + '_cell_' + row + '_' + col;
  }
}

/**
 * editable:
 *   - 0: no edit
 *   - 1: editable
 *   - 2: input filed
 * row = -1 -> headline
 */
xp.addCell = function(col, row, editable) {
  var edit = (editable == 2);
  var rowClass = xp.getRowClass(row);
  var colClass = xp.getColClass(col);
  var cellId = xp.getCellId(col, row, edit);
  var data = {'col':col, 'row':row};
  var text = xp.getCellData(row, col, (editable > 0));
  var classes = xp.getCellClasses(row, col);

  // construct cell
  var cell;
  if (edit) {
    cell = $('<input/>').attr('type','text');
  } else {
    cell = $('<div/>');
  }
  cell.attr('id', cellId);
  cell.addClass('xpCell');
  if (editable == 1) {
    cell.addClass('editable');
    cell.click(data, xp.onCellClickForAdmin);
  }
  cell.addClass(rowClass);
  cell.addClass(colClass);
  $.each(classes, function(index, propClass) {
    cell.addClass(propClass);
  });
  if (edit) {
    cell.val(text);
    cell.keydown(data, xp.onCellKey);
    cell.focus(data, xp.onCellFocus);
    cell.blur(data, xp.onCellBlur);
  } else {
    cell.text(text);
  }
  if (row == -1 && col != -1) {
    cell.resizable();
    cell.resizable( {minHeight: xp.getRowHeight(row,edit), 
                     maxHeight: xp.getRowHeight(row,edit)}
                  );
    cell.bind('resizestop',data, xp.onCellResize);
    cell.bind('resize',data, xp.onCellResizeProg);
  } else if (row != -1 && col == -1) {
    cell.resizable( {minWidth: xp.getColWidth(col,edit), 
                     maxWidth: xp.getColWidth(col,edit)}
                  );
    cell.bind('resizestop', data, xp.onCellResize);
    cell.bind('resize', data, xp.onCellResizeProg);
  } else if (xp.isUserEditField(row, col) && (editable == 0)) {
    cell.click(data, xp.onCellClickForUser);
  }
  cell.appendTo($('#' + xp.containerId));
  xp.resizeTable();
  if (edit) {
    cell.focus();
  }
}

// per-pixel resize
xp.onCellResizeProg = function(event, ui) {
  if (event.data.row == -1 && event.data.col != -1) {
    xp.colWidths[event.data.col] = Math.round(ui.size.width);
    xp.resizeTable();
  } else if (event.data.row != -1 && event.data.col == -1) {
    xp.rowHeights[event.data.row] = Math.round(ui.size.height);
    xp.resizeTable();
  }
}

// on stop: round width to multiple of defColRound, defRowRound
xp.onCellResize = function(event, ui) {
  if (event.data.row == -1 && event.data.col != -1) {
    xp.colWidths[event.data.col] = xp.defColRound * Math.round(ui.size.width / xp.defColRound);
    xp.resizeTable();
  } else if (event.data.row != -1 && event.data.col == -1) {
    xp.rowHeights[event.data.row] = xp.defRowRound * Math.round(ui.size.height / xp.defRowRound);
    xp.resizeTable();
  }
}

xp.resizeTable = function() {
  for (var row = -1; row < xp.numRow; row++) {
    var rowClass = xp.getRowClass(row);
    $('div.' + rowClass).css('height', xp.getRowHeight(row,false));
    $('input.' + rowClass).css('height', xp.getRowHeight(row,true));
    $('.' + rowClass).css('top', xp.getRowTop(row));
  }
  for (var col = -1; col < xp.numCol; col++) {
    var colClass = xp.getColClass(col);
    $('div.' + colClass).css('width', xp.getColWidth(col, false));
    $('input.' + colClass).css('width', xp.getColWidth(col, true));
    $('.' + colClass).css('left', xp.getColLeft(col));
  }
  var totalWidth = xp.getColLeft(xp.numCol);
  var totalHeight = xp.getRowTop(xp.numRow);
  $('#'+xp.containerId).css('width', totalWidth);
  $('#'+xp.containerId).css('height', totalHeight);
}

xp.onClickProp = function(event) {
  if (xp.currentFocus == null) {
    return;
  }
  if (event.data == 'val') {
    var propClass = $(this).val();
    if ($(this).prop('checked')) {
      xp.cellAddClass(xp.currentFocus.col, xp.currentFocus.row, propClass);
    } else {
      xp.cellDelClass(xp.currentFocus.col, xp.currentFocus.row, propClass);
    }
  } else if (event.data == 'radio') {
    var groupId = $(this).attr('id');
    $('#'+groupId+' input:not(:checked)').each(function (k, v) {
        xp.cellDelClass(xp.currentFocus.col, xp.currentFocus.row, v.value);
      });
    $('#'+groupId+' input:checked').each(function (k, v) {
        xp.cellAddClass(xp.currentFocus.col, xp.currentFocus.row, v.value);
      });
  }
  var cellId = xp.getCellId(xp.currentFocus.col, xp.currentFocus.row, true);
  $('#'+cellId).focus();
}

xp.cellAddClass = function(col, row, propClass) {
  var cellId = xp.getCellId(col, row, false);
  $('#'+cellId).addClass(propClass);
  var cellId = xp.getCellId(col, row, true);
  $('#'+cellId).addClass(propClass);
  if (!xp.data[row]) {  xp.data[row] = {}; }
  if (!xp.data[row][col]) { xp.data[row][col] = {}; }
  if (!xp.data[row][col]['classes']) { xp.data[row][col]['classes'] = []; }
  if (propClass == 'variable') {
    xp.data[row][col]['userEditField'] = 1;
  } else {
    xp.data[row][col]['classes'].push(propClass);
  }
}

xp.cellDelClass = function(col, row, propClass) {
  var cellId = xp.getCellId(col, row, false);
  $('#'+cellId).removeClass(propClass);
  var cellId = xp.getCellId(col, row, true);
  $('#'+cellId).removeClass(propClass);
  if (xp.data[row] && xp.data[row][col] && xp.data[row][col]['classes']) {
    xp.data[row][col]['classes'] = jQuery.grep(xp.data[row][col]['classes'], function(n) { return n != propClass; });
  }
  if (propClass == 'variable') {
    xp.data[row][col]['userEditField'] = 0;
  }
}

xp.onCellBlur = function(event) {
  event.stopPropagation();
}

xp.onCellFocus = function(event) {
  if (xp.currentFocus == event.data) {
    return;
  }
  if (xp.currentFocus != null) {
    var cellId = xp.getCellId(xp.currentFocus.col, xp.currentFocus.row, true);
    $('#'+cellId).removeClass('hasFocus');
  }
  xp.currentFocus = event.data;
  var cellId = xp.getCellId(event.data.col, event.data.row, true);
  $('#'+cellId).addClass('hasFocus');
  xp.configureToolbar(event.data.col, event.data.row);
}

xp.configureToolbar = function(col,row) {
  var classes = xp.getCellClasses(row, col);
  $('#toolbar').show();
  $( "#bold" ).attr('checked', $.inArray('bold', classes) != -1);
  $( "#italics" ).attr('checked', $.inArray('italics', classes) != -1);
  $( "#underline" ).attr('checked', $.inArray('underline', classes) != -1);
  $( "#variable" ).attr('checked', $.inArray('variable', classes) != -1);
  if ($.inArray('smallFontsize', classes) != -1) {
    $( "#fontsize0" ).attr('checked', true);
  } else if ($.inArray('bigFontsize', classes) != -1) {
    $( "#fontsize2" ).attr('checked', true);
  } else {
    $( "#fontsize1" ).attr('checked', true);
  }
  $( "#bold" ).button("refresh");
  $( "#italics" ).button("refresh");
  $( "#underline" ).button("refresh");
  $( "#variable" ).button("refresh");
  $( "#fontsize" ).buttonset("refresh");
  $( "#save" ).unbind('click');
  $( "#save" ).click({'col': col, 'row':row, 'confirm': true}, xp.onCellConfirm);
}

xp.onCellClickForUser = function(event) {
  alert(event.data.col, event.data.row);
  event.stopPropagation();
}

xp.onCellClickForAdmin = function(event) {
  xp.addCell(event.data.col,event.data.row,2);
  event.stopPropagation();
}

xp.onCellKey = function(event) {
  if (event.which != 13 &&
      event.which != 27) {
    return;
  }
  event.data.confirm = (event.which == 13);
  xp.onCellConfirm(event);
}

xp.onCellConfirm = function(event) {
  var text = xp.destroyCell(event.data.col, event.data.row, true);
  xp.currentFocus = null;
  $('#toolbar').hide();
  if (event.data.confirm) {
    xp.updateCell(event.data.col, event.data.row, text, false);
  }
  event.stopPropagation();
}

xp.updateCell = function(col, row, text = '', edit = false) {
  xp.setCellData(col,row,text);
  var cellId = xp.getCellId(col, row, edit);
  if (edit) {
    content = $('#'+cellId).val(text);
  } else {
    content = $('#'+cellId).text(text);
  }
}

xp.destroyCell = function(col, row, edit = false) {
  var cellId = xp.getCellId(col, row, edit);
  var content;
  if (edit) {
    content = $('#'+cellId).val();
  } else {
    content = $('#'+cellId).text();
  }
  $('#'+cellId).remove();
  return content;
}

xp.clearTable = function() {
  var container = $('#' + xp.containerId);
  container.empty();
}

xp.initTable = function() {
  xp.clearTable();
  var editable = 0;
  if (xp.adminMode) {
    editable = 1;
    $('#admintoolbar').show();
  } else {
    $('#admintoolbar').hide();
  }
  // add header
  xp.addCell(-1, -1);
  for (var i=0; i < xp.numCol; i++) {
    xp.addCell(i, -1);
  }
  // add data
  for (var row = 0; row < xp.numRow; row++) {
    xp.addCell(-1, row);
    for (var col = 0; col < xp.numCol; col++) {
      xp.addCell(col, row, editable);
    }
  }

}

xp.setCellData = function(col, row, text) {
  if (text != '') {
    if (!xp.data[row]) {
      xp.data[row] = {};
    }
    if (!xp.data[row][col]) {
      xp.data[row][col] = {};
    }
    xp.data[row][col]['text'] = text;
  } else {
    if (!xp.data[row]) {
      return;
    }
    if (xp.data[row][col]) {
      delete xp.data[row][col];
    }
    if (Object.keys(xp.data[row]).length == 0) {
      delete xp.data[row];
    }
  }
}

xp.isUserEditField = function(row, col) {
  return (xp.data[row] && xp.data[row][col] && (xp.data[row][col]['userEditField'] == 1));
}

xp.getCellData = function(row, col, edit) {
  if (row == -1 && col == -1) {
    return '';
  } else if (row == -1) {
    return xp.colName(col);
  } else if (col == -1) {
    return row+'.';
  }
  if ((!edit)
      && xp.isUserEditField(row, col)
      && xp.ass[row] && xp.ass[row][col]) {
    return xp.ass[row][col]['name'];
  }
  if (xp.data[row] && xp.data[row][col] && xp.data[row][col]['text']) {
    return xp.data[row][col]['text'];
  }
  return '';
}

xp.getCellClasses = function(row, col) {
  var cls = ['fontsize1'];
  if (xp.data[row] && xp.data[row][col] && xp.data[row][col]['classes']) {
    cls = xp.data[row][col]['classes'];
  }
  if (xp.isUserEditField(row, col)) {
    cls.push('variable');
  }
  return cls;
}

xp.onTabChange = function(event, ui) {
  switch (ui.panel.id) {
    case "planlist": 
      xp.initSelection();
     break;
    case "plan":
     xp.initTable();
     break;
    case "usermgnt":
     xp.refreshUserGroupList();
     break;
  }
}

xp.refreshUserGroupList = function() {
  // 3. request
  $.post('ajax/users.php', {'action':'list'})
   .success(function (values, status, req) {
      xp.refreshUserGroupListHandler(values);
    })
   .error(xp.ajaxErrorHandler);
}

xp.refreshUserGroupListHandler = function(values) {
  $( "#userlist").empty();
  $( ".grplist").empty();
  // set items
  xp.users = values.users;
  xp.groups = values.groups;
  $( '#userlist').append($('<option>', {value: '', text: 'neu'}));
  for (k in values.users) {
    $( '#userlist').append($('<option>', {value: k, text: k}));
  }
  for (k in values.groups) {
    $( '.grplist').append($('<option>', {value: k, text: k}));
  }
  xp.onSelectUser();
  xp.onSelectGroup();
}

xp.onSelectUser = function() {
  var currentUser = $('#userlist').val();
  $('#usrgrplist').empty();
  if (currentUser == '') {
    $('#user_email').val('');
    $('#user_password').val('');
    $('#user_admin').attr('checked', false);
  } else {
    $('#user_email').val(xp.users[currentUser].email);
    $('#user_password').val(xp.users[currentUser].password);
    $('#user_admin').attr('checked', xp.users[currentUser].admin == 1);
    for (k in xp.users[currentUser].groups) {
      var v = xp.users[currentUser].groups[k];
      $('#usrgrplist').append($('<option>', {value: v, text: v}));
    }
  }
}

xp.onDeleteGroup = function(event) {
  var data = { };

  event.stopPropagation();

  var currentGroup = $('#grplist').val();
  if (currentGroup == '') {
    return false;
  }
  data.group = currentGroup;
  data.action = 'deleteGroup';
  $.post('ajax/users.php', data)
   .success(function (values, status, req) {
     alert('Die Gruppe wurde erfolgreich entfernt.');
     xp.refreshUserGroupListHandler(values);
    })
   .error(xp.ajaxErrorHandler);
  return false;
}

xp.onDeleteUser = function(event) {
  var data = { };

  event.stopPropagation();

  var currentUser = $('#userlist').val();
  if (currentUser == '') {
    return false;
  }
  data.uid = currentUser;
  data.action = 'delete';
  $.post('ajax/users.php', data)
   .success(function (values, status, req) {
     alert('Der Nutzer wurde erfolgreich entfernt.');
     xp.refreshUserGroupListHandler(values);
    })
   .error(xp.ajaxErrorHandler);
  return false;
}

xp.onSaveUser = function(event) {
  var data = { };
  var numChangedAttr = 0;

  event.stopPropagation();

  var currentUser = $('#userlist').val();
  var emailOld = (currentUser == '' ? null : xp.users[currentUser].email);
  var emailNew = $('#user_email').val();
  var pwOld = (currentUser == '' ? null : xp.users[currentUser].password);
  var pwNew = $('#user_password').val();
  var adminOld = (currentUser == '' ? null : xp.users[currentUser].admin);
  var adminNew = ($('#user_admin').attr('checked') ? 1 : 0);

  data.uid = currentUser;
  if (pwOld !== pwNew) {
    numChangedAttr++;
    data.password = pwNew;
  }
  if (emailOld !== emailNew) {
    numChangedAttr++;
    data.email = emailNew;
  }
  if (adminOld !== adminNew) {
    numChangedAttr++;
    data.admin = adminNew;
  }
  data.action = 'save';

  if (numChangedAttr == 0) {
    alert('Es wurden keine Details geändert.');
    return false;
  }

  $.post('ajax/users.php', data)
   .success(function (values, status, req) {
     alert('Der Nutzer wurde erfolgreich gespeichert.');
     xp.refreshUserGroupListHandler(values);
    })
   .error(xp.ajaxErrorHandler);
  return false;
}

xp.onCreateGroup = function(event) {
  var data = { };

  event.stopPropagation();

  var newGrp = $('#grp').val();
  if (newGrp == '') {
    return false;
  }

  data.group = newGrp;
  data.action = 'insertGroup';

  $.post('ajax/users.php', data)
   .success(function (values, status, req) {
     alert('Die Gruppe wurde erfolgreich gespeichert.');
     $('#grp').val('');
     xp.refreshUserGroupListHandler(values);
    })
   .error(xp.ajaxErrorHandler);
  return false;
}

xp.onAssignToGroup = function(event) {

  event.stopPropagation();

  var group = $('#grplist2').val();
  var currentUser = $('#userlist').val();
  if (group == '' || currentUser == '') {
    return false;
  }
  var data = { };
  data.action = 'addUserToGroup';
  data.group = group;
  data.user = currentUser;
  $.post('ajax/users.php', data)
   .success(function (values, status, req) {
     alert('Die Gruppe wurde erfolgreich zugeordnet.');
     xp.refreshUserGroupListHandler(values);
    })
   .error(xp.ajaxErrorHandler);
  return false;
}

xp.onUnassignFromGroup = function(event) {

  event.stopPropagation();

  var group = $('#usrgrplist').val();
  var currentUser = $('#userlist').val();
  if (group == '' || currentUser == '') {
    return false;
  }
  var data = { };
  data.action = 'removeUserFromGroup';
  data.group = group;
  data.user = currentUser;
  $.post('ajax/users.php', data)
   .success(function (values, status, req) {
     alert('Dem Nutzer wurden erfolreich die Rechte an der Gruppe entzogen.');
     xp.refreshUserGroupListHandler(values);
    })
   .error(xp.ajaxErrorHandler);
  return false;
}

xp.onSelectGroup = function() {
  $('#grp').val('');
  $('#grpadm').empty();
  var currentGroup = $('#grplist').val();
  if (currentGroup == '') {
    return false;
  }
  for (var k in xp.groups[currentGroup].members) {
    var v = xp.groups[currentGroup].members[k];
    $('#grpadm').append($('<li>', {text: v}));
  }
}

xp.initSelection = function() {
  $('#section2').val(''); 
  $.post('ajax/list.php', {})
   .success(function (values, status, req) {
     xp.pads = values;
     $('#section').empty();
     $('#grplist3').empty();
     $('#tpllist').empty();
     $('<option/>', {value: '', text: 'leere Vorlage'}).appendTo($('#tpllist'));

     for (var group in values) {
       $( '#grplist3').append($('<option>', {value: group, text: group}));
       if (Object.keys(values[group]['']).length > 0) {
         // group has templates
         $( '#grplist4').append($('<option>', {value: group, text: group}));
         var grpObj = $('<optgroup/>', {label: group}).appendTo($('#tpllist'));
         for (var pad in values[group]['']) {
           $('<option/>', {value: pad, text: values[group][''][pad]['name']}).appendTo(grpObj);
         }
       }
       if (Object.keys(values[group]).length > 1) {
         // group has non-template sections
         var grpObj = $('<optgroup/>', {label: group}).appendTo($('#section'));
         for (var section in values[group]) {
           if (section != '') {
             $('<option/>', {value: JSON.stringify({'group':group, 'section':section}), text: section}).appendTo(grpObj);
           }
         }
       }
     }
     xp.switchPlanListToSection(null);
     xp.switchTplListToSection(null);
    })
   .error(xp.ajaxErrorHandler);
}

xp.onCreatePlan = function(event) {
  event.stopPropagation();
  var data = {};
  data.group = $('#grplist3').val();
  data.section = $('#section2').val();
  data.template = $('#tpllist').val();
  data.name = $('#name').val();
  data.action = 'createPlan';

  if (data.section == '') {
    if (!confirm('Eine leere Bereichsangabe bedeutet, eine Vorlage zu erstellen. Wollen Sie wirklich nur eine Vorlage erstellen?')) {
      return false;
    }
  }

  $.post('ajax/planmanage.php', data)
   .success(function (values, status, req) {
     xp.initSelection();
     if (!xp.pads[values.meta.group_id]) { xp.pads[values.meta.group_id] = {};}
     if (!xp.pads[values.meta.group_id][values.meta.section_id]) { xp.pads[values.meta.group_id][values.meta.section_id] = {};}
     xp.pads[values.meta.group_id][values.meta.section_id][values.id]=values.meta;
     xp.adminMode = true;
     xp.switchToPlan({'group': values.meta.group_id, 'section': values.meta.section_id, 'id': values.id});
    })
   .error(xp.ajaxErrorHandler);
  return false;
}

xp.onClickPlan = function(event) {
  if (event.data.section == '') {
    if (!confirm('Wollen Sie wirklich die Vorlage bearbeiten?')) {
      return false;
    }
    xp.adminMode = true;
  } else {
    xp.adminMode = false;
  }
  xp.switchToPlan(event.data);
  return false;
}

xp.switchToPlan = function(data) {
  var planId = data.id;
  var group = data.group;
  var section = data.section;
  var plan = xp.pads[group][section][planId];
  xp.currentPlanId = data;

  $.post('ajax/plan.php', {'id': planId, 'action':'listPlanData'})
   .success(function (values, status, req) {
     xp.data = values.data;
     xp.ass = values.assistant;
     xp.configureUserToolbar();
     xp.configureAdminToolbar();
     $("#tabs").tabs("select", "#plan");
    })
   .error(xp.ajaxErrorHandler);
}

xp.configureUserToolbar = function() {
  var data = xp.currentPlanId;
  var planId = data.id;
  var group = data.group;
  var section = data.section;
  var plan = xp.pads[group][section][planId];
  $('#usertoolbar').show();
  $('#usertoolbar_name').text(plan.name);
  $('#usertoolbar_from').text(plan.eventStart);
  $('#usertoolbar_to').text(plan.eventEnd);
  $("#toadmin").attr('checked', xp.adminMode);
  $("#toadmin").button("refresh");
}
xp.configureAdminToolbar = function() {
  var data = xp.currentPlanId;
  var planId = data.id;
  var group = data.group;
  var section = data.section;
  var plan = xp.pads[group][section][planId];

  $('#admintoolbar_group_id').text(plan.group_id);
  $('#admintoolbar_section_id').val(plan.section_id);
  $('#admintoolbar_id').text(plan.id);
  $('#admintoolbar_name').val(plan.name);
  $('#admintoolbar_comment').val(plan.comment);
  $('#admintoolbar_eventStart').val(plan.eventStart);
  $('#admintoolbar_eventEnd').val(plan.eventEnd);
  $('#admintoolbar_editStart').val(plan.editStart);
  $('#admintoolbar_editEnd').val(plan.editEnd);
  $('#admintoolbar_creator').text(plan.creator);
  if (plan.editPassword == 1) {
    $('#admintoolbar_editPassword').val('**gesetzt**');
  }
  if (plan.adminPassword == 1) {
    $('#admintoolbar_adminPassword').val('**gesetzt**');
  }
}

xp.switchPlanListToSection = function(event) {
  if (event != null) {
    event.stopPropagation();
  }
  var section = $('#section').val();
  if (section == '') {
    return false;
  }
  section = JSON.parse( section );
  $('#ulplanlist').empty();
  for (var k in xp.pads[section.group][section.section]) {
    var plan = xp.pads[section.group][section.section][k];
    $('<li/>', {text: plan["name"]}).appendTo($('#ulplanlist')).click({'group': section.group, 'section': section.section, 'id':plan.id}, xp.onClickPlan);
  }
}

xp.onChangeAdminMode = function(event) {
  xp.adminMode = $(this).prop('checked');
  xp.initTable();
}

xp.onDeletePlan = function(event) {
  event.stopPropagation();
  var data = xp.currentPlanId;
  var planId = data.id;
  var group = data.group;
  var section = data.section;
  var plan = xp.pads[group][section][planId];
  if (confirm ('Soll der Plan '+group+'/'+section+'/'+planId+' '+plan.name+' wirklich entfernt werden?')) {
    $.post('ajax/planmanage.php', {'action':'deletePlan', 'id': planId})
     .success(function (values, textStatus, jqXHR) {
      $("#tabs").tabs("select", "#planlist");
    })
    .error(xp.ajaxErrorHandler);
  }
  return false;
}

xp.ajaxErrorHandler = function (jqXHR, textStatus, errorThrown) {
      t = window.open('','fehler');
      t.document.writeln(jqXHR);
      t.document.writeln(textStatus);
      t.document.writeln(errorThrown);
      t.document.close();
};

xp.onSavePlan = function(event) {
  event.stopPropagation();

  var data = {};
  data.section_id = $('#admintoolbar_section_id').val();
  data.id = xp.currentPlanId.id;
  data.name = $('#admintoolbar_name').val();
  data.comment = $('#admintoolbar_comment').val();
  data.eventStart = $('#admintoolbar_eventStart').val();
  data.eventEnd = $('#admintoolbar_eventEnd').val();
  data.editStart = $('#admintoolbar_editStart').val();
  data.editEnd = $('#admintoolbar_editEnd').val();
  data.editPassword = $('#admintoolbar_editPassword').val();
  data.adminPassword = $('#admintoolbar_adminPassword').val();

  if (data.editPassword == '' || data.editPassword == '**gesetzt**') {
    delete data.editPassword;
  }
  if (data.adminPassword == '' || data.adminPassword == '**gesetzt**') {
    delete data.adminPassword;
  }
  data.action = 'savePlan';

  $.post('ajax/planmanage.php', data)
   .success(function (values, textStatus, jqXHR) {
    alert('Meta-Daten wurden gespeichert.');
  })
  .error(xp.ajaxErrorHandler);

  return false;
}

xp.onNewTemplate = function(event) {
  event.stopPropagation();

  var planId = xp.currentPlanId.id;
  var group = xp.currentPlanId.group;
  var section = xp.currentPlanId.section;
  var plan = xp.pads[group][section][planId];

  var data = {};
  data.id = planId;
  data.group = group;
  data.name = plan.name;
  data.action = 'createTemplate';

  $.post('ajax/planmanage.php', data)
   .success(function (values, textStatus, jqXHR) {
    alert('Eine Vorlage wurde gespeichert.');
  })
  .error(xp.ajaxErrorHandler);

  return false;
}

xp.switchTplListToSection = function(event) {
  if (event != null) {
    event.stopPropagation();
  }
  var group = $('#grplist4').val();
  if (group == '') {
    return;
  }
  $('#ulplanlist2').empty();
  for (var k in xp.pads[group]['']) {
    var plan = xp.pads[group][''][k];
    $('<li/>', {text: plan["name"]}).appendTo($('#ulplanlist2')).click({'group': group, 'section': '', 'id':plan.id}, xp.onClickPlan);
  }
}

xp.init = function() {
  $('#toolbar').hide();
  $('#admintoolbar').hide();
  $('#usertoolbar').hide();
  $('#tabs').tabs({show: xp.onTabChange});
  $( "#save" ).button({
            text: false,
            icons: {
                primary: "ui-icon-disk"
            }});
  $( "#bold" ).button().change('val', xp.onClickProp);
  $( "#italics" ).button().change('val', xp.onClickProp);
  $( "#underline" ).button().change('val', xp.onClickProp);
  $( "#variable" ).button().change('val', xp.onClickProp);
  $( "#fontsize" ).buttonset().change('radio', xp.onClickProp);
  $( "#userlist" ).change(xp.onSelectUser);
  $( "#user_save" ).click(xp.onSaveUser);
  $( "#user_delete" ).click(xp.onDeleteUser);
  $( "#grp_insert" ).click(xp.onCreateGroup);
  $( "#grp_delete" ).click(xp.onDeleteGroup);
  $( "#grp_assign" ).click(xp.onAssignToGroup);
  $( "#grp_unassign" ).click(xp.onUnassignFromGroup);
  $( "#grplist" ).change(xp.onSelectGroup);
  $( "#plan_create" ).click(xp.onCreatePlan);
  $( "#section" ).change(xp.switchPlanListToSection);
  $( "#grplist4" ).change(xp.switchTplListToSection);
  $( "#toadmin" ).button().change(xp.onChangeAdminMode);
  $('#admintoolbar_eventStart').datetimepicker({'dateFormat': 'yy-mm-dd', 'timeFormat': 'hh:mm:ss'});
  $('#admintoolbar_eventEnd').datetimepicker({'dateFormat': 'yy-mm-dd', 'timeFormat': 'hh:mm:ss'});
  $('#admintoolbar_editStart').datetimepicker({'dateFormat': 'yy-mm-dd', 'timeFormat': 'hh:mm:ss'});
  $('#admintoolbar_editEnd').datetimepicker({'dateFormat': 'yy-mm-dd', 'timeFormat': 'hh:mm:ss'});
  $( "#deleteplan" ).button().click(xp.onDeletePlan);
  $( "#saveplan" ).button().click(xp.onSavePlan);
  $( "#totemplate" ).button().click(xp.onNewTemplate);
}

if (!Object.keys) {
    Object.keys = function (obj) {
        var keys = [],
            k;
        for (k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                keys.push(k);
            }
        }
        return keys;
    };
}

$(xp.init);

// FIXME Bereich-Sel, Plan_list
