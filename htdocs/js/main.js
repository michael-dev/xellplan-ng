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
xp.firstRun = true;
xp.log = {};
xp.login = null;
xp.loginTimer = null;

if (! Array.prototype.clone ) {
  Array.prototype.clone = function() {
    var arr1 = new Array();
    for (var property in this) {
        arr1[property] = this[property];
    }
    return arr1;
  }
}

jQuery.extend({
  parseQuerystring: function(){
    var nvpair = {};
    var qs = window.location.search.replace('?', '');
    var pairs = qs.split('&');
    $.each(pairs, function(i, v){
      var pair = v.split('=');
      nvpair[pair[0]] = pair[1];
    });
    return nvpair;
  }
});

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
  if (Object.prototype.hasOwnProperty.call(xp.colWidths,col)) {
    w += parseInt(xp.colWidths[col]);
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
  if (Object.prototype.hasOwnProperty.call(xp.rowHeights,row)) {
    h += parseInt(xp.rowHeights[row]);
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
  var text = xp.getCellData(col, row, (editable > 0));
  var classes = xp.getCellClasses(col, row);
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
  if (xp.adminMode) {
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
    }
  }
  if (row != -1 && col != -1 && xp.userCanEditField(col, row) && (editable == 0)) {
    cell.click(data, xp.onCellClickForUser);
  }
  cell.appendTo($('#' + xp.containerId));
  if (edit) {
    cell.focus();
  }
}

// per-pixel resize
xp.onCellResizeProg = function(event, ui) {
  if (!ui || !ui.size) {
    xp.resizeTable();
    return;
  }
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
  var data = {};
  data.action = 'setWidth';
  data.id = xp.currentPlanId.id;
  if (event.data.row == -1 && event.data.col != -1) {
    xp.colWidths[event.data.col] = xp.defColRound * Math.round(ui.size.width / xp.defColRound);
    xp.resizeTable();
    data.width = xp.colWidths[event.data.col];
    data.idx = event.data.col;
    data.type = 'col';
  } else if (event.data.row != -1 && event.data.col == -1) {
    xp.rowHeights[event.data.row] = xp.defRowRound * Math.round(ui.size.height / xp.defRowRound);
    xp.resizeTable();
    data.width = xp.rowHeights[event.data.row];
    data.idx = event.data.row;
    data.type = 'row';
  }
  $.post('ajax/planmanage.php', data)
   .error(xp.ajaxErrorHandler);
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
  xp.saveCell(xp.currentFocus.col, xp.currentFocus.row);
  var cellId = xp.getCellId(xp.currentFocus.col, xp.currentFocus.row, true);
  $('#'+cellId).focus();
}

xp.cellAddClass = function(col, row, propClass) {
  var cellId;
  cellId = xp.getCellId(col, row, false);
  $('#'+cellId).addClass(propClass);
  cellId = xp.getCellId(col, row, true);
  $('#'+cellId).addClass(propClass);
  if (!xp.data[row]) {  xp.data[row] = {}; }
  if (!xp.data[row][col]) { xp.data[row][col] = {}; }
  if (!Object.prototype.hasOwnProperty.call(xp.data[row][col], 'classes')) { xp.data[row][col]['classes'] = ['fontsize1']; }
  if (propClass == 'variable') {
    xp.data[row][col]['userEditField'] = 1;
    xp.configureUserToolbar();
  } else {
    xp.data[row][col]['classes'].push(propClass);
  }
}

xp.cellDelClass = function(col, row, propClass) {
  var cellId;
  cellId = xp.getCellId(col, row, false);
  $('#'+cellId).removeClass(propClass);
  cellId = xp.getCellId(col, row, true);
  $('#'+cellId).removeClass(propClass);
  if (xp.data[row] && xp.data[row][col] && Object.prototype.hasOwnProperty.call(xp.data[row][col], 'classes')) {
    xp.data[row][col]['classes'] = jQuery.grep(xp.data[row][col]['classes'], function(n) { return n != propClass; });
  }
  if (propClass == 'variable') {
    xp.data[row][col]['userEditField'] = 0;
    xp.configureUserToolbar();
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
    xp.onCellConfirmHandler(xp.currentFocus.col, xp.currentFocus.row, true);
  }
  xp.currentFocus = event.data;
  var cellId = xp.getCellId(event.data.col, event.data.row, true);
  $('#'+cellId).addClass('hasFocus');
  xp.configureToolbar(event.data.col, event.data.row);
}

xp.configureToolbar = function(col,row) {
  var classes = xp.getCellClasses(col, row);
  $('#toolbar').css('visibility','visible');
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
  $( "#save" ).click({'col': col, 'row':row}, xp.onCellConfirm);
}

xp.onDisplayVariable = function(event) {
  event.stopPropagation();
  $( "#userdialogpw").dialog("close");
  var pw = $('#var_password2').val();
  $('#var_password').val(pw);
  var planId = xp.currentPlanId.id;
  var row = xp.currentFocus.row;
  var col = xp.currentFocus.col;

  $.ajax({
      url: 'ajax/plan.php',
      type: 'POST',
      data: {'id': planId, 'action':'listPlanDataEMail', 'password': pw},
      success: function (values, status, req) {
                 xp.ass = values.assistant;
                 if (xp.ass[row] && xp.ass[row][col]) {
                   $('#var_mail').val(xp.ass[row][col].email);
                 } else {
                   $('#var_mail').val('');
                 }
                 $("#userdialog").dialog("open");
                 $( "#userdialog").dialog("widget").position({
                   my: 'left top',
                   at: 'left top',
                   of: $("#" + xp.getCellId(col, row, 0))
                 });
               },
      error: xp.ajaxErrorHandler,
      async:   false
 });
}

xp.onCellClickForUser = function(event) {
  event.stopPropagation();
  $('#var_password').val('');
  $('#var_password2').val('');

  var row = event.data.row;
  var col = event.data.col;
  var planId = xp.currentPlanId.id;
  var group = xp.currentPlanId.group;
  var section = xp.currentPlanId.section;
  var plan = xp.pads[group][section][planId];

  if ((plan.editPassword == 1) && !(xp.ass[row] && xp.ass[row][col] && Object.prototype.hasOwnProperty.call(xp.ass[row][col], 'email'))) {
    $( "#userdialogpw").dialog("open");
    $( "#userdialogpw").dialog("widget").position({
       my: 'left top',
       at: 'left top',
       of: $(this)
    });
  } else {
    $( "#userdialog").dialog("open");
    $( "#userdialog").dialog("widget").position({
       my: 'left top',
       at: 'left top',
       of: $(this)
    });
  }

  xp.currentFocus = event.data;
  if (xp.ass[row] && xp.ass[row][col]) {
    $('#var_name').val(xp.ass[row][col].name);
    $('#var_organization').val(xp.ass[row][col].organization);
    $('#var_mail').val(xp.ass[row][col].email);
  } else {
    $('#var_name').val('');
    $('#var_organization').val('');
    $('#var_mail').val('');
  }

  if (plan.editPassword == 1) {
    $('.var_password').show();
    $('.var_captcha').hide();
  } else {
    $('.var_password').hide();
    $('.var_captcha').show();
    xp.onRefreshCaptcha();
  }
  return false;
}

xp.onRefreshCaptcha = function(event) {
  if (event != null) {
    event.stopPropagation();
  }
  $('#captcha').attr('src','');
  $('#var_captcha').val('');
  $.post('ajax/captcha.php', {})
   .success(function (values, status, req) {
     $('#captcha').attr('src','data:'+values.meta+';base64,'+values.img);
     xp.captchaId = values.id;
    })
   .error(xp.ajaxErrorHandler);
  return false;
}

xp.onSaveVariable = function (event) {
  var planId = xp.currentPlanId.id;
  var var_name = $('#var_name').val();
  var var_organization = $('#var_organization').val();
  var var_email = $('#var_mail').val();
  var var_captcha = $('#var_captcha').val();
  var var_password = $('#var_password').val();
  var plan = xp.pads[xp.currentPlanId.group][xp.currentPlanId.section][planId];
  if (var_name == '') {
    var_name = var_email;
  }
  if (plan.editPassword == 0) {
    if (var_captcha == '') {
      alert('Bitte Captcha eingeben!');
      return false;
    }
  } else {
    if (var_password == '') {
      alert('Bitte Passwort eingeben!');
      return false;
    }
  }
  var data = {};
  data.id = planId;
  data.row = xp.currentFocus.row;
  data.col = xp.currentFocus.col;
  data.name = var_name;
  data.organization = var_organization;
  data.email = var_email;
  data.captcha = var_captcha;
  data.captchaId = xp.captchaId;
  data.password = var_password;
  data.action = 'setCell';
  $.post('ajax/plan.php', data)
   .success(function (values, status, req) {
     $( "#userdialog").dialog("close");
     $( "#userdialogpw").dialog("close");
     if (!xp.ass[xp.currentFocus.row]) { xp.ass[xp.currentFocus.row] = []; }
     if (values.data != false) {
       xp.ass[xp.currentFocus.row][xp.currentFocus.col] = values.data;
     } else {
       delete xp.ass[xp.currentFocus.row][xp.currentFocus.col];
     }
     xp.destroyCell(xp.currentFocus.col, xp.currentFocus.row, false);
     xp.addCell(xp.currentFocus.col, xp.currentFocus.row, false);
     xp.resizeTable();
     xp.currentFocus = null;
    })
   .error(xp.ajaxErrorHandler);
  return false;
}
xp.onCancelVariable = function (event) {
  $( "#userdialog").dialog("close");
  $( "#userdialogpw").dialog("close");
  xp.currentFocus = null;
}

xp.onCellClickForAdmin = function(event) {
  /* save current scroll position */
  var scrollTop = $(window).scrollTop();
  var scrollLeft = $(window).scrollLeft();
  /* ---- */
  if (event.data.col + 1 == xp.numCol) {
    xp.addCells(xp.numCol + 1, xp.numRow);
  }
  if (event.data.row + 1 == xp.numRow) {
    xp.addCells(xp.numCol, xp.numRow + 1);
  }
  xp.addCell(event.data.col,event.data.row,2);
  xp.resizeTable();
  /* restore current scroll position */
  $(window).scrollTop(scrollTop);
  $(window).scrollLeft(scrollLeft);
  /* ---- */
  event.stopPropagation();
}

xp.onCellKey = function(event) {
  if (event.which != 13 &&
      event.which != 27) {
    return;
  }
  event.stopPropagation();
  xp.onCellConfirmHandler(event.data.col, event.data.row, (event.which == 13));
  return false;
}

xp.onCellConfirm = function(event) {
  event.stopPropagation();
  xp.onCellConfirmHandler(event.data.col, event.data.row, true);
  return false;
}

xp.onCellConfirmHandler = function(col, row, cfrm) {
  var text = xp.destroyCell(col, row, true);
  xp.currentFocus = null;
  $('#toolbar').css('visibility','hidden');
  if (cfrm) {
    xp.updateCell(col, row, text, false);
    xp.saveCell(col, row);
  }
}

xp.updateCell = function(col, row, text, edit) {
  xp.setCellData(col,row,text);
  var cellId = xp.getCellId(col, row, edit);
  if (edit) {
    $('#'+cellId).val(text);
  } else {
    $('#'+cellId).text(text);
  }
}

xp.destroyCell = function(col, row, edit) {
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

xp.addCells = function(numCol, numRow) {
  if (numCol < xp.numCol || numRow < xp.numRow) {
    alert('addCells cannot downsize');
    return;
  }
  var editable;
  if (xp.adminMode) {
    editable = 1;
  } else {
    editable = 0;
  }
  // existing rows: add new columns
  for (var col = xp.numCol; col < numCol; col++) {
    xp.addCell(col, -1);
    for (var row = 0; row < xp.numRow; row++) {
      xp.addCell(col, row, editable);
    }
  }
  // existing columns: add new rows
  for (var row = xp.numRow; row < numRow; row++) {
    xp.addCell(-1, row);
    for (var col = 0; col < xp.numCol; col++) {
      xp.addCell(col, row, editable);
    }
  }
  // add lower right corner
  for (var row = xp.numRow; row < numRow; row++) {
    for (var col = xp.numCol; col < numCol; col++) {
      xp.addCell(col, row, editable);
    }
  }
  // update internal size vars
  xp.numCol = numCol;
  xp.numRow = numRow;
  // update column and rows size
  xp.resizeTable();
}

xp.initLog = function() {
  var data = xp.currentPlanId;
  if (data == null) { return; }
  var planId = data.id;
  var group = data.group;
  var section = data.section;
  var plan = xp.pads[group][section][planId];
  if (plan == null || !plan) { return; }
  $('#logtoolbar_name').text(plan.name);
  $('#dplanlog').empty();
  for (var k in xp.log) {
    var log = xp.log[k];
    var tr = $('<li/>').appendTo($('#dplanlog'));
    $('<div/>').appendTo(tr).text(log.eventTime);
    var cell = xp.colName(parseInt(log.col))+log.row;
    $('<div/>').appendTo(tr).text(cell);
    $('<div/>').appendTo(tr).text(log.text);
  }
}

xp.initTable = function() {
  // save size
  var numCol = xp.numCol;
  var numRow = xp.numRow;
  // init toolbar
  if (xp.adminMode) {
    $('#admintoolbar').show();
    $('#toolbar').show();
    $('#toolbar').css('visibility','hidden');
  } else {
    $('#admintoolbar').hide();
    $('#toolbar').hide();
  }
  // add -1,-1 header field
  xp.clearTable();
  xp.addCell(-1, -1);
  xp.numCol = 0;
  xp.numRow = 0;
  // size table
  xp.addCells(numCol, numRow);
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

xp.saveCell = function(col, row) {
  var data = {};
  data.action = 'setCell';
  data.id = xp.currentPlanId.id;
  data.col = col;
  data.row = row;
  if (xp.data[row] && xp.data[row][col] && Object.prototype.hasOwnProperty.call(xp.data[row][col], 'classes')) {
    data.classes = xp.data[row][col]['classes'];
    if (data.classes.length == 0) {
      data.classes = null;
    }
  }
  if (xp.data[row] && xp.data[row][col] && Object.prototype.hasOwnProperty.call(xp.data[row][col], 'text')) {
    data.text = xp.data[row][col]['text'];
  }
  if (xp.data[row] && xp.data[row][col] && Object.prototype.hasOwnProperty.call(xp.data[row][col], 'userEditField')) {
    data.editable = xp.data[row][col]['userEditField'];
  }
  var cellId1 = xp.getCellId(col, row, false);
  var cellId2 = xp.getCellId(col, row, true);
  $('#'+cellId1).addClass('saveInProgress');
  $('#'+cellId2).addClass('saveInProgress');

  $.post('ajax/planmanage.php', data)
   .success(function (values, status, req) {
     $('#'+cellId1).removeClass('saveInProgress');
     $('#'+cellId2).removeClass('saveInProgress');
    })
   .error(xp.ajaxErrorHandler);
}

xp.userCanEditField = function(col, row) {
  if (!xp.isUserEditField(col, row)) { return false; }
  var planId = xp.currentPlanId.id;
  var group = xp.currentPlanId.group;
  var section = xp.currentPlanId.section;
  var plan = xp.pads[group][section][planId];
  return (plan.userEditable == 1);
}

xp.isUserEditField = function(col, row) {
  return (xp.data[row] && xp.data[row][col] && (xp.data[row][col]['userEditField'] == 1));
}

xp.getDataSize = function() {
  var numRow = 10;
  var numCol = 10;
  // row,col starts counting with 0
  for (var row in xp.data) {
    if (numRow < parseInt(row) + 1) {
      numRow = parseInt(row) + 1;
    }
    for (var col in xp.data[row]) {
      if (numCol < parseInt(col) + 1) {
        numCol = parseInt(col) + 1;
      }
    }
  }
  return [numCol, numRow];
}

xp.getCellData = function(col, row, edit) {
  if (row == -1 && col == -1) {
    return '';
  } else if (row == -1) {
    return xp.colName(col);
  } else if (col == -1) {
    return row+'.';
  }
  var ret = '';
  if ((!edit)
      && xp.isUserEditField(col, row)
      && xp.ass[row] && xp.ass[row][col]) {
    ret = xp.ass[row][col]['name'];
  }
  if (ret == '' && xp.data[row] && xp.data[row][col] && Object.prototype.hasOwnProperty.call(xp.data[row][col], 'text')) {
    ret = xp.data[row][col]['text'];
  }
  if (ret == null) { ret = ''; }
  return ret;
}

xp.getCellClasses = function(col, row) {
  var cls = ['fontsize1'];
  if (xp.data[row] && xp.data[row][col] && Object.prototype.hasOwnProperty.call(xp.data[row][col], 'classes')) {
    cls = xp.data[row][col]['classes'].clone();
  }
  if (xp.isUserEditField(col, row)) {
    cls.push('variable');
    if (xp.ass[row] && xp.ass[row][col]) {
      cls.push('variable-filled');
    } else {
      cls.push('variable-empty');
    }
  }
  return cls;
}

xp.onTabChange = function(event, ui) {
  switch (ui.newPanel.attr('id')) {
    case "planlist":
      xp.initSelection();
     break;
    case "plan":
     if (xp.currentPlanId == null) {
       alert("Es wurde kein Plan ausgewählt.");
       $("#tabs").tabs( "option", "active", 0);
       return false;
     }
     xp.initTable();
     break;
    case "planlog":
     if (xp.currentPlanId == null) {
       alert("Es wurde kein Plan ausgewählt.");
       $("#tabs").tabs( "option", "active", 0);
       return false;
     }
     xp.initLog();
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
  if (currentUser == '' || currentUser == null) {
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
  if (currentGroup == '' || currentGroup == null) {
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
  if (currentUser == '' || currentUser == null) {
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
  var emailOld = (currentUser == '' || currentUser == null ? null : xp.users[currentUser].email);
  var emailNew = $('#user_email').val();
  var pwOld = (currentUser == '' || currentUser == null ? null : xp.users[currentUser].password);
  var pwNew = $('#user_password').val();
  var adminOld = (currentUser == '' || currentUser == null ? null : xp.users[currentUser].admin);
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
  if (newGrp == '' || newGrp == null) {
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
  if (currentGroup == '' || currentGroup == null) {
    return false;
  }
  for (var k in xp.groups[currentGroup].members) {
    var v = xp.groups[currentGroup].members[k];
    if (k != 'clone') {
      $('#grpadm').append($('<li>', {text: v}));
    }
  }
}

xp.initSelection = function() {
  $('#section2').val('');
  $.post('ajax/list.php', {})
   .success(function (values, status, req) {
     xp.pads = values;
     $('#section').empty();
     $('#grplist3').empty();
     $('#grplist4').empty();
     $('#tpllist').empty();
     $('<option/>', {value: '', text: 'leere Vorlage'}).appendTo($('#tpllist'));
     var qs = jQuery.parseQuerystring();
     var alreadySelected = false;

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
             var opt = $('<option/>', {value: JSON.stringify({'group':group, 'section':section}), text: section}).appendTo(grpObj);
             /* find editable plan */
             for (var k in values[group][section]) {
               var plan = values[group][section][k];
               if (plan.userEditable == 1 && !alreadySelected) {
                 opt.attr('selected','selected');
                 alreadySelected = true;
               }
             }
             /* query string jump */
             if (xp.firstRun && qs["planId"] && Object.prototype.hasOwnProperty.call(values[group][section], qs["planId"])) {
               qs["group"] = group;
               qs["section"] = section;
             }
           }
         }
       }
     }
     if (xp.firstRun && qs["planId"] && qs["group"] && qs["section"]) {
       xp.switchToPlan({'id':qs["planId"], 'group':qs["group"], 'section':qs["section"]});
     } else {
       xp.switchPlanListToSection(null);
       xp.switchTplListToSection(null);
     }
     xp.firstRun = false;
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
  event.stopPropagation();
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
     xp.colWidths = values.colWidths;
     xp.rowHeights = values.rowHeights;
     xp.log = values.log;
     var size = xp.getDataSize();
     xp.numCol = size[0];
     xp.numRow = size[1];
     xp.configureUserToolbar();
     xp.configureAdminToolbar();
     $("#tabs").tabs( "option", "active", 1);
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
  $('#usertoolbar_comment').text(plan.comment);
  $('#footer_editStart').text(plan.editStart);
  $('#footer_editEnd').text(plan.editEnd);
  var contact = plan.contact;
  if (contact == '' || !contact) {
    contact = plan.creator;
  }
  $('#footer_contact').text(contact);
  $('#footer_contact').attr('href', 'mailto:'+contact);
  var link=self.location.protocol + '//' + self.location.host+self.location.pathname+'?planId='+planId;
  $('#footer_link').text(link);
  $('#footer_link').attr('href',link);

  var numTotal = 0;
  var numOpen = 0;
  var numDone = 0;
  for (var row = 0; row < xp.numRow; row++) {
    for (var col = 0; col < xp.numCol; col++) {
      if (xp.isUserEditField(col, row)) {
        numTotal++;
        if (xp.ass[row] && xp.ass[row][col]) {
          numDone++;
        } else {
          numOpen++;
        }
      }
    }
  }
  $('#footer_editableTotal').text(numTotal);
  $('#footer_editableCompleted').text(numDone);
  $('#footer_editableFree').text(numOpen);
  if (numOpen > 0) {
    $('#footer_editableFree_ind').addClass('missingEditable');
    $('#footer_editableFree_ind').removeClass('noMissingEditable');
  } else {
    $('#footer_editableFree_ind').addClass('noMissingEditable');
    $('#footer_editableFree_ind').removeClass('missingEditable');
  }
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
  var lines = plan.comment.match(/^.*((\r\n|\n|\r)|$)/gm);
  var commentRows = lines.length + 3;
  var commentCols = 40;
  for (var line in lines) {
    if (commentCols < line.length + 4) {
      commentCols = line.length + 4;
    }
  }
  $('#admintoolbar_comment').val(plan.comment);
  $('#admintoolbar_comment').attr('rows', commentRows);
  $('#admintoolbar_comment').attr('cols', commentCols);
  $('#admintoolbar_eventStart').val(plan.eventStart);
  $('#admintoolbar_eventEnd').val(plan.eventEnd);
  $('#admintoolbar_editStart').val(plan.editStart);
  $('#admintoolbar_editEnd').val(plan.editEnd);
  $('#admintoolbar_creator').text(plan.creator);
  $('#admintoolbar_contact').val(plan.contact);
  if (plan.editPassword == 1) {
    $('#admintoolbar_editPassword').val('**gesetzt**');
  } else {
    $('#admintoolbar_editPassword').val('');
  }
  if (plan.adminPassword == 1) {
    $('#admintoolbar_adminPassword').val('**gesetzt**');
  } else {
    $('#admintoolbar_adminPassword').val('');
  }
}

/* takes YYYY-MM-DD HH:MM:SS string and returns Date object */
xp.parseDateString = function(str) {
  if (str === null) { return null; }
  var tmp = str.split(" ");
  var tmp2 = tmp[0].split("-");
  var str_jahr = tmp2[0];
  var str_monat = tmp2[1];
  var str_tag = tmp2[2];
  var tmp2 = tmp[1].split(":");
  var str_stunde = tmp2[0];
  var str_minute = tmp2[1];
  var str_sekunde = tmp2[2];
  return new Date(str_jahr, str_monat - 1, str_tag, str_stunde, str_minute, str_sekunde);
}

xp.formatTime = function(obj) {
  var ret = String(obj.getHours());
  if (obj.getMinutes() != 0 || obj.getSeconds() != 0) {
    ret += ':';
    if (obj.getMinutes() < 10) { ret += '0'; }
    ret += obj.getMinutes();
    if (obj.getSeconds() != 0) {
      ret += ':';
      if (obj.getSeconds() < 10) { ret += '0'; }
      ret += obj.getSeconds();
    }
  }
  ret += 'h';
  return ret;
}

xp.formatTimeRange = function(von, bis) {
  von = xp.parseDateString(von);
  bis = xp.parseDateString(bis);
  var jetzt = new Date();

  var ret = '';
  // render von
  var format = 'd. M yy';
  if (von !== null) {
    if (jetzt.getFullYear() == von.getFullYear()) {
      format = 'd. M';
    }
    ret += $.datepicker.formatDate(format, von);
    ret += ' ' + xp.formatTime(von);
  }
  ret += ' bis ';
  // render bis
  if (bis != null) {
    if (von !== null && (von.getFullYear() != bis.getFullYear() ||
        von.getMonth() != bis.getMonth() ||
        von.getDate() != bis.getDate())) {
      var format = 'd. M yy';
      if (jetzt.getFullYear() == bis.getFullYear()) {
        format = 'd. M';
      }
      ret += $.datepicker.formatDate(format, bis);
    }
    ret += ' ' + xp.formatTime(bis);
  }

  return ret;
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
  if (section == null) {
    return;
  }
  $('#dplanlist').empty();
  for (var k in xp.pads[section.group][section.section]) {
    var plan = xp.pads[section.group][section.section][k];
    var tr = $('<tr/>').appendTo($('#dplanlist'));
    tr.click({'group': section.group, 'section': section.section, 'id':plan.id}, xp.onClickPlan);
    if (plan.userEditable == 1) {
      tr.addClass('editablePlan');
    } else {
      tr.addClass('ineditablePlan');
    }
    $('<td/>').appendTo(tr).text(plan.name);
    var zeit1 = 'Projekt: ' + xp.formatTimeRange(plan.eventStart, plan.eventEnd);
    var zeit2 = 'Eintragen: ' + xp.formatTimeRange(plan.editStart, plan.editEnd);
    $('<td/>').appendTo(tr).append($('<span/>').text(zeit1)).append($('<br/>')).append($('<span/>').text(zeit2));
    if (plan.editPassword == 1) {
      $('<td/>').appendTo(tr).text('ERFORDERLICH');
    } else {
      $('<td/>').appendTo(tr).text('OHNE');
    }
  }
}

xp.onChangeAdminMode = function(event) {
  xp.adminMode = $(this).prop('checked');
  if (xp.adminMode) {
    if (xp.currentFocus != null) {
      xp.onCellConfirmHandler(xp.currentFocus.col, xp.currentFocus.row, true);
    }
    $('#toolbar').hide();
  } else {
    $('#toolbar').show();
  }
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
      $("#tabs").tabs( "option", "active", 0);
    })
    .error(xp.ajaxErrorHandler);
  }
  return false;
}

xp.ajaxErrorHandler = function (jqXHR, textStatus, errorThrown) {
  var t = window.open('','fehler');
  var msg = String(textStatus) + '\n' + String(errorThrown) + '\n' + String(jqXHR.responseText);
  if ( t === null) {
    alert(msg);
  } else {
    t.document.open('text/plain');
    t.document.writeln(msg);
    t.document.close();
  }
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
  data.contact = $('#admintoolbar_contact').val();
  data.editPassword = $('#admintoolbar_editPassword').val();
  data.adminPassword = $('#admintoolbar_adminPassword').val();

  if (data.editPassword == '') {
    data.editPassword = null;
  } else if (data.editPassword == '**gesetzt**') {
    delete data.editPassword;
  }
  if (data.adminPassword == '') {
    data.adminPassword = null;
  } else if (data.adminPassword == '**gesetzt**') {
    delete data.adminPassword;
  }
  data.action = 'savePlan';

  $.post('ajax/planmanage.php', data)
   .success(function (values, textStatus, jqXHR) {
    alert('Meta-Daten wurden gespeichert.');
    var planId = xp.currentPlanId.id;
    var group = xp.currentPlanId.group;
    var section = xp.currentPlanId.section;
    xp.pads[group][section][planId] = values.data;
    xp.configureUserToolbar();
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
  if (group == '' || group == null) {
    return;
  }
  $('#ulplanlist2').empty();
  for (var k in xp.pads[group]['']) {
    var plan = xp.pads[group][''][k];
    $('<li/>', {text: plan["name"]}).appendTo($('#ulplanlist2')).click({'group': group, 'section': '', 'id':plan.id}, xp.onClickPlan);
  }
}

xp.setLoginStatus = function() {
  $.post('ajax/login.php', {url: self.location.href})
   .success(function (values, textStatus, jqXHR) {
    xp.login = values;
    if (xp.login.loginMode != "basic") {
      $('.login').show();
      if (xp.login.isAuth) {
        $('.loginauth').show();
        $('.loginnoauth').hide();
        $('.loginemail').text(xp.login.email);
      } else {
        $('.loginauth').hide();
        $('.loginnoauth').show();
      }
      $('.loginbtn').attr('href',xp.login.loginUrl);
      $('.logoutbtn').attr('href',xp.login.logoutUrl);
    } else {
      $('.login').hide();
      clearInterval(xp.loginTimer);
    }
  });
  // no error handler -> would be called too often
}

xp.onLoginClick = function(event) {
  // prompt for username/password
  return false;
}

xp.init = function() {
  $('#toolbar').hide();
  $('#admintoolbar').hide();
  $('#usertoolbar').hide();
  $('#tabs').tabs({activate: xp.onTabChange});
  xp.initSelection();
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
  $( "#userdialog").dialog({'autoOpen':false, 'modal':true, 'width':1000});
  $( "#userdialogpw").dialog({'autoOpen':false, 'modal':true, 'width':1000});
  $( "#var_save" ).button().click(xp.onSaveVariable);
  $( "#var_cancel" ).button().click(xp.onCancelVariable);
  $( "#var_display_pw" ).button().click(xp.onDisplayVariable);
  $( "#var_cancel_pw" ).button().click(xp.onCancelVariable);
  $( "#refreshcaptcha").click(xp.onRefreshCaptcha);
  $( "#loginbtn").click(xp.onLoginClick);
  xp.loginTimer = setInterval(xp.setLoginStatus,1000);
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

// vim: set expandtab ts=2 sw=2
