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
   }
   $result["id"] = $planId;
   $pads = $pdo->prepare("SELECT group_id, section_id, id, name, comment, eventStart, eventEnd, editStart, editEnd, creator, (editPassword IS NOT NULL) AS editPassword, (adminPassword IS NOT NULL) AS adminPassword FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
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
   $dropPlanStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
   $dropPlanStmt->execute(Array($_REQUEST["id"])) or httperror($dropPlanStmt->errorInfo());
 break;
 case "savePlan":
   requirePadAdmin($_REQUEST["id"]);
   foreach (Array('section_id', 'id', 'name', 'comment', 'eventStart', 'eventEnd', 'editStart', 'editEnd', 'editPassword', 'adminPassword') AS $key) {
     if (!isset($_REQUEST[$key])) { continue; }
     $value = $_REQUEST[$key];
     if (empty($value)) { $value = NULL; }
     $updPlanStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pads SET $key = ? WHERE id = ?") or httperror($pdo->errorInfo());
     $updPlanStmt->execute(Array($value, $_REQUEST["id"])) or httperror($updPlanStmt->errorInfo());
   }
 break;
 case "createTemplate":
   requireGroupAdmin($_REQUEST["group"]);
   $createPlanStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pads (group_id, section_id, name, creator) VALUES (?, ?, ?, ?)") or httperror($pdo->errorInfo());
   $createPlanStmt->execute(Array($_REQUEST["group"], '', $_REQUEST["name"], $_SERVER["PHP_AUTH_USER"])) or httperror($createPlanStmt->errorInfo());
   $planId = $pdo->lastInsertId();
   $tmplPlanStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_data (pad_id, row, col, text, classes, userEditField) SELECT ?, row, col, text, classes, userEditField FROM ${DB_PREFIX}pad_data WHERE pad_id = ?") or httperror($pdo->errorInfo());
   $tmplPlanStmt->execute(Array($planId, $_REQUEST["id"])) or httperror($tmplPlanStmt->errorInfo());
 break;
 case "setCell":
   requirePadAdmin($_REQUEST["id"]);
 break;
 default:
   httperror("invalid action");
 break;
endswitch;

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

