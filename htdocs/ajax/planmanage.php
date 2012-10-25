<?php

global $pdo, $DB_PREFIX, $pwObj;
include '../../lib/inc.all.php';

$result = Array();

switch ($_REQUEST["action"]):
 case "createPlan":
   requireGroupAdmin($_REQUEST["group"]);
   $createPlanStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pads (group_id, section_id, name, creator) VALUES (?, ?, ?, ?)") or die(print_r($pdo->errorInfo(),true));
   $createPlanStmt->execute(Array($_REQUEST["group"], $_REQUEST["section"], $_REQUEST["name"], $_SERVER["PHP_AUTH_USER"])) or die(print_r($createPlanStmt->errorInfo(),true));
   $planId = $pdo->lastInsertId();
   if (!empty($_REQUEST["template"])) {
     $tmplPlanStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_data (pad_id, row, col, text, classes, userEditField) SELECT ?, row, col, text, classes, userEditField FROM ${DB_PREFIX}pad_data WHERE pad_id = ?") or die(print_r($pdo->errorInfo(),true));
     $tmplPlanStmt->execute(Array($planId, $_REQUEST["template"])) or die(print_r($tmplPlanStmt->errorInfo(),true));
   }
   $result["id"] = $planId;
   $pads = $pdo->query("SELECT group_id, section_id, id, name, comment, eventStart, eventEnd, editStart, editEnd, creator FROM ${DB_PREFIX}pads WHERE id = ?") or die(print_r($pdo->errorInfo(),true));
   $pads->execute(Array($planId)) or die(print_r($pads->errorInfo(),true));
   $rows = $pads->fetchAll();
   $results["data"] = $rows[0];
 break;
 case "setCell":
   requirePadAdmin($_REQUEST["padId"]);
 break;
 default:
   die("invalid action");
 break;
endswitch;

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

