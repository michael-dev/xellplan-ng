<?php
global $pdo, $DB_PREFIX, $pwObj;
include '../../lib/inc.all.php';

$result = Array();

switch ($_REQUEST["action"]):
 case "createPlan":
   requireGroupAdmin($_REQUEST["group"]);
   $createPlanStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pads (group_id, section_id, name, creator) VALUES (?, ?, ?, ?)") or httperror($pdo->errorInfo());
   $createPlanStmt->execute(Array($_REQUEST["group"], $_REQUEST["section"], $_REQUEST["name"], $_SERVER["PHP_AUTH_USER"])) or httperror($createPlanStmt->errorInfo());
   $planId = $pdo->lastInsertId();
   if (!empty($_REQUEST["template"])) {
     $tmplPlanStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_data (pad_id, row, col, text, classes, userEditField) SELECT ?, row, col, text, classes, userEditField FROM ${DB_PREFIX}pad_data WHERE pad_id = ?") or httperror($pdo->errorInfo());
     $tmplPlanStmt->execute(Array($planId, $_REQUEST["template"])) or httperror($tmplPlanStmt->errorInfo());
     $tmplPlanStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_width (pad_id, type, idx, width) SELECT ?, type, idx, width FROM ${DB_PREFIX}pad_width WHERE pad_id = ?") or httperror($pdo->errorInfo());
     $tmplPlanStmt->execute(Array($planId, $_REQUEST["template"])) or httperror($tmplPlanStmt->errorInfo());
   }
   $result["id"] = $planId;
   $pads = $pdo->prepare("SELECT group_id, section_id, id, name, comment, eventStart, eventEnd, editStart, editEnd, creator, contact, (editPassword IS NOT NULL) AS editPassword, (adminPassword IS NOT NULL) AS adminPassword, ( (editEnd > NOW()) AND (editStart < NOW()) ) AS userEditable FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
   $pads->execute(Array($planId)) or httperror($pads->errorInfo());
   $rows = $pads->fetchAll(PDO::FETCH_ASSOC);
   $result["meta"] = $rows[0];
 break;
 case "deletePlan":
   requirePadAdmin($_REQUEST["id"]);
   $dropPlanStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ?") or httperror($pdo->errorInfo());
   $dropPlanStmt->execute(Array($_REQUEST["id"])) or httperror($dropPlanStmt->errorInfo());
   $dropPlanStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_log WHERE pad_id = ?") or httperror($pdo->errorInfo());
   $dropPlanStmt->execute(Array($_REQUEST["id"])) or httperror($dropPlanStmt->errorInfo());
   $dropPlanStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_data WHERE pad_id = ?") or httperror($pdo->errorInfo());
   $dropPlanStmt->execute(Array($_REQUEST["id"])) or httperror($dropPlanStmt->errorInfo());
   $dropPlanStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_width WHERE pad_id = ?") or httperror($pdo->errorInfo());
   $dropPlanStmt->execute(Array($_REQUEST["id"])) or httperror($dropPlanStmt->errorInfo());
   $dropPlanStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
   $dropPlanStmt->execute(Array($_REQUEST["id"])) or httperror($dropPlanStmt->errorInfo());
 break;
 case "savePlan":
   requirePadAdmin($_REQUEST["id"]);
   foreach (Array('section_id', 'id', 'name', 'comment', 'eventStart', 'eventEnd', 'editStart', 'editEnd', 'contact', 'editPassword', 'adminPassword','contactHint','subscribeHint') AS $key) {
     if (!isset($_REQUEST[$key])) { continue; }
     $value = $_REQUEST[$key];
     if (empty($value)) { $value = NULL; }
     elseif ($key == "editPassword" || $key == "adminPassword") { $value = $pwObj->createPasswordHash($value); }
     $updPlanStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pads SET $key = ? WHERE id = ?") or httperror($pdo->errorInfo());
     $updPlanStmt->execute(Array($value, $_REQUEST["id"])) or httperror($updPlanStmt->errorInfo());
   }
   $pads = $pdo->prepare("SELECT group_id, section_id, id, name, comment, eventStart, eventEnd, editStart, editEnd, creator, contact, (editPassword IS NOT NULL) AS editPassword, (adminPassword IS NOT NULL) AS adminPassword, ( (editEnd > NOW()) AND (editStart < NOW()) ) AS userEditable FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
   $pads->execute(Array($_REQUEST["id"])) or httperror($pads->errorInfo());
   $result["data"] = $pads->fetch(PDO::FETCH_ASSOC);
 break;
 case "createTemplate":
   requireGroupAdmin($_REQUEST["group"]);
   $createPlanStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pads (group_id, section_id, name, creator) VALUES (?, ?, ?, ?)") or httperror($pdo->errorInfo());
   $createPlanStmt->execute(Array($_REQUEST["group"], '', $_REQUEST["name"], $_SERVER["PHP_AUTH_USER"])) or httperror($createPlanStmt->errorInfo());
   $planId = $pdo->lastInsertId();
   $tmplPlanStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_data (pad_id, row, col, text, classes, userEditField) SELECT ?, row, col, text, classes, userEditField FROM ${DB_PREFIX}pad_data WHERE pad_id = ?") or httperror($pdo->errorInfo());
   $tmplPlanStmt->execute(Array($planId, $_REQUEST["id"])) or httperror($tmplPlanStmt->errorInfo());
   $tmplPlanStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_width (pad_id, type, idx, width) SELECT ?, type, idx, width FROM ${DB_PREFIX}pad_width WHERE pad_id = ?") or httperror($pdo->errorInfo());
   $tmplPlanStmt->execute(Array($planId, $_REQUEST["id"])) or httperror($tmplPlanStmt->errorInfo());
 break;
 case "setWidth":
   requirePadAdmin($_REQUEST["id"]);
   $padDataStmt = $pdo->prepare("SELECT COUNT(*) AS ctn FROM ${DB_PREFIX}pad_width WHERE pad_id = ? AND type = ? AND idx = ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["type"], $_REQUEST["idx"])) or httperror($padDataStmt->errorInfo());
   $rows = $padDataStmt->fetch(PDO::FETCH_ASSOC);
   if ($rows["ctn"] == 0) {
     $padDataStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_width (pad_id, type, idx, width) VALUES (?, ?, ?, ?)") or httperror($pdo->errorInfo());
     $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["type"], $_REQUEST["idx"], $_REQUEST["width"])) or httperror($padDataStmt->errorInfo());
   } else {
     $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_width SET width = ? WHERE pad_id = ? AND type = ? AND idx = ?") or httperror($pdo->errorInfo());
     $padDataStmt->execute(Array($_REQUEST["width"], $_REQUEST["id"], $_REQUEST["type"], $_REQUEST["idx"])) or httperror($padDataStmt->errorInfo());
   }
 break;
 case "setCell":
   requirePadAdmin($_REQUEST["id"]);
   $padDataStmt = $pdo->prepare("SELECT COUNT(*) AS ctn FROM ${DB_PREFIX}pad_data WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   $rows = $padDataStmt->fetch(PDO::FETCH_ASSOC);
   if ($rows["ctn"] == 0) {
     $padDataStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_data (pad_id, row, col) VALUES (?, ?, ?)") or httperror($pdo->errorInfo());
     $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   }
   if (!isset($_REQUEST["text"])) {
     $_REQUEST["text"] = null;
   }
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_data SET text = ? WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["text"], $_REQUEST["id"], $_REQUEST["row"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   if (isset($_REQUEST["editable"])) {
     $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_data SET userEditField = ? WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
     $padDataStmt->execute(Array($_REQUEST["editable"], $_REQUEST["id"], $_REQUEST["row"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   }
   if (isset($_REQUEST["classes"])) {
     $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_data SET classes = ? WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
     $padDataStmt->execute(Array(implode(",",$_REQUEST["classes"]), $_REQUEST["id"], $_REQUEST["row"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   }
 break;
 case "addrow":
   requirePadAdmin($_REQUEST["id"]);
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_data SET row = row + 1 WHERE pad_id = ? AND row >= ? ORDER BY row DESC") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_assistant SET row = row + 1 WHERE pad_id = ? AND row >= ? ORDER BY row DESC") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_width SET idx = idx + 1 WHERE pad_id = ? AND idx >= ? AND type = 'row' ORDER BY idx DESC") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"])) or httperror($padDataStmt->errorInfo());
 break;
 case "addcol":
   requirePadAdmin($_REQUEST["id"]);
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_data SET col = col + 1 WHERE pad_id = ? AND col >= ? ORDER BY col DESC") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_assistant SET col = col + 1 WHERE pad_id = ? AND col >= ? ORDER BY col DESC") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_width SET idx = idx + 1 WHERE pad_id = ? AND idx >= ? AND type = 'col' ORDER BY idx DESC") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
 break;
 case "delrow":
   requirePadAdmin($_REQUEST["id"]);
   $padDataStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_data WHERE pad_id = ? AND row = ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ? AND row = ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_width WHERE pad_id = ? AND idx = ? AND type = 'row'") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_data SET row = row - 1 WHERE pad_id = ? AND row > ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_assistant SET row = row - 1 WHERE pad_id = ? AND row > ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_width SET idx = idx - 1 WHERE pad_id = ? AND idx > ? AND type = 'row'") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"])) or httperror($padDataStmt->errorInfo());
 break;
 case "delcol":
   requirePadAdmin($_REQUEST["id"]);
   $padDataStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_data WHERE pad_id = ? AND col = ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ? AND col = ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_width WHERE pad_id = ? AND idx = ? AND type = 'col'") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_data SET col = col - 1 WHERE pad_id = ? AND col > ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_assistant SET col = col - 1 WHERE pad_id = ? AND col > ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   $padDataStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_width SET idx = idx - 1 WHERE pad_id = ? AND idx > ? AND type = 'col'") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($_REQUEST["id"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
 break;
 case "exportPlan":
   requirePadAdmin($_REQUEST["id"]);
   $planId = (int) $_REQUEST["id"];

   $padStmt = $pdo->prepare("SELECT group_id, section_id, id, name, comment, eventStart, eventEnd, editStart, editEnd, creator, contact, (editPassword IS NOT NULL) AS editPassword, (adminPassword IS NOT NULL) AS adminPassword, subscribeHint, contactHint FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
   $padStmt->execute(Array($planId)) or httperror($padDataStmt->errorInfo());
   $padDetails = $padStmt->fetch(PDO::FETCH_ASSOC);

   $padDataStmt = $pdo->prepare("SELECT row, col, text, classes, userEditField FROM ${DB_PREFIX}pad_data WHERE pad_id = ?") or httperror($pdo->errorInfo());
   $padDataStmt->execute(Array($planId)) or httperror($padDataStmt->errorInfo());
   $rows = $padDataStmt->fetchAll(PDO::FETCH_ASSOC);

   $maxRow = 10; $maxcol = 10;
   $padData = Array();
   foreach ($rows as $row) {
     $row["classes"] = explode(",", $row["classes"]);
     $padData[$row["row"]][$row["col"]] = $row;
     $maxRow = max($maxRow, $row["row"]);
     $maxCol = max($maxCol, $col["col"]);
   }

   $padAssStmt = $pdo->prepare("SELECT row, col, name, organization, email FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ?") or httperror($pdo->errorInfo());
   $padAssStmt->execute(Array($planId)) or httperror($padAssStmt->errorInfo());
   $rows = $padAssStmt->fetchAll(PDO::FETCH_ASSOC);
   $padAssistant = Array();
   foreach ($rows as $row) {
     $padAssistant[$row["row"]][$row["col"]] = $row;
     $maxRow = max($maxRow, $row["row"]);
     $maxCol = max($maxCol, $row["col"]);
   }

   header('Set-Cookie: fileDownload=true; path='.dirname(dirname($_SERVER["PHP_SELF"])));
   header('Cache-Control: max-age=60, must-revalidate');
   header("Content-Type: text/csv; charset=utf-8");
   header('Content-Disposition: attachment; filename="'.$_REQUEST["id"]. '.csv"');

   $outstream = fopen("php://output",'w');  
   fputcsv($outstream, Array('Gruppe:', $padDetails["group_id"], 'Bereich:', $padDetails["section_id"], 'Plan:', $padDetails["name"], "ID:", $padDetails["id"]));
   fputcsv($outstream, Array('Ersteller:', $padDetails["contact"], 'ursprünglich:', $padDetails["creator"]));
   fputcsv($outstream, Array('Ereignis (von,bis):', $padDetails["eventStart"], $padDetails["eventEnd"]));
   fputcsv($outstream, Array('Eintragen (von,bis):', $padDetails["editStart"], $padDetails["editEnd"]));
   fputcsv($outstream, Array('Kommentar:', $padDetails["comment"]));
   fputcsv($outstream, Array('Bearbeiten-Kennwort:', $padDetails["adminPassword"] ? "ja" : "nein", "Dienste-Kenntwort:", $padDetails["editPassword"] ? "ja" : "nein"));
   fputcsv($outstream, Array('Information für Dienste:', $padDetails["subscribeHint"]));
   fputcsv($outstream, Array('Abgefragte Kontaktdaten:', $padDetails["contactHint"]));
   fputcsv($outstream, Array('Zeilen:', $maxRow + 1, "Spalten:", $maxCol + 1));
   fputcsv($outstream, Array(''));
   fputcsv($outstream, Array('Inhalt'));
   // Table Header
   $csvRow = Array("");
   $csvRow2 = Array("");
   for ($col = 0; $col <= $maxCol; $col++) {
      $csvRow[] = colName($col);
      $csvRow2[] = "Feld";
      $csvRow[] = colName($col);
      $csvRow2[] = "Feld-Typ";
      $csvRow[] = colName($col);
      $csvRow2[] = "Name";
      $csvRow[] = colName($col);
      $csvRow2[] = "Organisation";
      $csvRow[] = colName($col);
      $csvRow2[] = "Kontakt";
   }
   fputcsv($outstream, $csvRow);
   fputcsv($outstream, $csvRow2);
   // Table content
   for ($row = 0; $row <= $maxRow; $row++) {
     $csvRow = Array(($row+1).".");
     for ($col = 0; $col <= $maxCol; $col++) {
      //$csvRow2[] = "Feld";
      $csvRow[] = $padData[$row][$col]["text"];
      //$csvRow2[] = "Feld-Typ";
      $csvRow[] = ($padData[$row][$col]["userEditField"] ? "Dienste-Feld":"")." ".implode(",", array_unique($padData[$row][$col]["classes"]));
      //$csvRow2[] = "Name";
      $csvRow[] = $padAssistant[$row][$col]["name"];
      //$csvRow2[] = "Organisation";
      $csvRow[] = $padAssistant[$row][$col]["organization"];
      //$csvRow2[] = "Kontakt";
      $csvRow[] = $padAssistant[$row][$col]["email"];
     }
     fputcsv($outstream, $csvRow);
   }
   exit;
 break;
 default:
   httperror("invalid action: ".htmlspecialchars($_REQUEST["action"]));
 break;
endswitch;

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

