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
xp.data = { 0: { 0: {text: 'hallo', classes : [ 'bold' ] } } };
xp.currentFocus = null;

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

xp.getColWidth = function(col, edit = false) {
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

xp.getRowHeight = function(row,edit = false) {
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
    return 'headline';
  } else {
    return 'row' + row;
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
  var cellId = xp.getCellId(col, row, edit);
  var data = {'col':col, 'row':row};
  var text = xp.getCellData(row, col);
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
    cell.click(data, xp.onCellClick);
  }
  if (col == -1) {
   cell.addClass('xpCellNumber');
  } else {
   cell.addClass('xpCellColumn' + col);
  }
  if (row == -1) {
   cell.addClass('xpCellHeader');
  } else {
   cell.addClass('xpCellRow' + row);
  }
  $.each(classes, function(index, propClass) {
    cell.addClass(propClass);
  });
  cell.css('width', xp.getColWidth(col,edit));
  cell.css('height', xp.getRowHeight(row,edit));
  cell.css('left', xp.getColLeft(col));
  cell.css('top', xp.getRowTop(row));
  if (edit) {
    cell.val(text);
    cell.keydown(data, xp.onCellConfirm);
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
  } else if (row != -1 && col == -1) {
    cell.resizable( {minWidth: xp.getColWidth(col,edit), 
                     maxWidth: xp.getColWidth(col,edit)}
		  );
    cell.bind('resizestop', data, xp.onCellResize);
  }
  cell.appendTo($('#' + xp.containerId));
  if (edit) {
    cell.focus();
  }
}

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
  for (var row = 0; row < xp.numRow; row++) {
    $('div.xpCellRow' + row).css('height', xp.getRowHeight(row,false));
    $('input.xpCellRow' + row).css('height', xp.getRowHeight(row,true));
    $('.xpCellRow' + row).css('top', xp.getRowTop(row));
  }
  for (var col = 0; col < xp.numCol; col++) {
    $('div.xpCellColumn' + col).css('width', xp.getColWidth(col, false));
    $('input.xpCellColumn' + col).css('width', xp.getColWidth(col, true));
    $('.xpCellColumn' + col).css('left', xp.getColLeft(col));
  }
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
  xp.data[row][col]['classes'].push(propClass);
}

xp.cellDelClass = function(col, row, propClass) {
  var cellId = xp.getCellId(col, row, false);
  $('#'+cellId).removeClass(propClass);
  var cellId = xp.getCellId(col, row, true);
  $('#'+cellId).removeClass(propClass);
  if (xp.data[row] && xp.data[row][col] && xp.data[row][col]['classes']) {
    xp.data[row][col]['classes'] = jQuery.grep(xp.data[row][col]['classes'], function(n) { return n != propClass; });
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
  $( "#fontsize" ).buttonset("refresh");
}

xp.onCellClick = function(event) {
  xp.addCell(event.data.col,event.data.row,2);
  event.stopPropagation();
}

xp.onCellConfirm = function(event) {
  if (event.which != 13 &&
      event.which != 27) {
    return;
  }
  var text = xp.destroyCell(event.data.col, event.data.row, true);
  xp.currentFocus = null;
  $('#toolbar').hide();
  if (event.which == 13) {
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
  // add header
  xp.addCell(-1, -1);
  for (var i=0; i < xp.numCol; i++) {
    xp.addCell(i, -1);
  }
  // add data
  for (var row = 0; row < xp.numRow; row++) {
    xp.addCell(-1, row);
    for (var col = 0; col < xp.numCol; col++) {
      xp.addCell(col, row, 1);
    }
  }

}

xp.setCellData = function(row, col, text) {
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

xp.getCellData = function(row, col) {
  if (row == -1 && col == -1) {
    return '';
  } else if (row == -1) {
    return xp.colName(col);
  } else if (col == -1) {
    return row+'.';
  }
  if (xp.data[row] && xp.data[row][col] && xp.data[row][col]['text']) {
    return xp.data[row][col]['text'];
  }
  return '';
}

xp.getCellClasses = function(row, col) {
  if (xp.data[row] && xp.data[row][col] && xp.data[row][col]['classes']) {
    return xp.data[row][col]['classes'];
  }
  return ['fontsize1'];
}

xp.init = function() {
  $('#toolbar').hide();
  xp.initTable();
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
}

$(xp.init);

