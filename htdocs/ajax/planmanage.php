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
   $pads = $pdo->prepare("SELECT group_id, section_id, id, name, comment, eventStart, eventEnd, editStart, editEnd, creator, (editPassword IS NOT NULL) AS editPassword, (adminPassword IS NOT NULL) AS adminPassword, ( (editEnd > NOW()) AND (editStart < NOW()) ) AS userEditable FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
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
   foreach (Array('section_id', 'id', 'name', 'comment', 'eventStart', 'eventEnd', 'editStart', 'editEnd', 'contact', 'editPassword', 'adminPassword') AS $key) {
     if (!isset($_REQUEST[$key])) { continue; }
     $value = $_REQUEST[$key];
     if (empty($value)) { $value = NULL; }
     elseif ($key == "editPassword" || $key == "adminPassword") { $value = $pwObj->hashPassword($value); }
     $updPlanStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pads SET $key = ? WHERE id = ?") or httperror($pdo->errorInfo());
     $updPlanStmt->execute(Array($value, $_REQUEST["id"])) or httperror($updPlanStmt->errorInfo());
   }
   $pads = $pdo->prepare("SELECT group_id, section_id, id, name, comment, eventStart, eventEnd, editStart, editEnd, creator, (editPassword IS NOT NULL) AS editPassword, (adminPassword IS NOT NULL) AS adminPassword, ( (editEnd > NOW()) AND (editStart < NOW()) ) AS userEditable FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
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
 default:
   httperror("invalid action");
 break;
endswitch;

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

