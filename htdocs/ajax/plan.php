<?php

global $pdo, $DB_PREFIX;
include '../../lib/inc.all.php';

$result = Array();

switch ($_REQUEST["action"]):
 case "listPlanData":
  $padDataStmt = $pdo->prepare("SELECT row, col, text, classes, userEditField FROM ${DB_PREFIX}pad_data WHERE pad_id = ?") or die(print_r($pdo->errorInfo(),true));
  $padDataStmt->execute(Array($_REQUEST["id"])) or die(print_r($padDataStmt->errorInfo(),true));
  $rows = $padDataStmt->fetchAll();
  foreach ($rows as $row) {
    $result[$row["row"]][$row["col"]] = $row;
  }
 break;
 default:
  die("invalid action");
 break;
endswitch;

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

