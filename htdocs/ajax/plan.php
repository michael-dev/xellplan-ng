<?php

global $pdo, $DB_PREFIX;
include '../../lib/inc.all.php';

$result = Array();

switch ($_REQUEST["action"]):
 case "listPlanData":
  $padDataStmt = $pdo->prepare("SELECT row, col, text, classes, userEditField FROM ${DB_PREFIX}pad_data WHERE pad_id = ?") or httperror($pdo->errorInfo());
  $padDataStmt->execute(Array($_REQUEST["id"])) or httperror($padDataStmt->errorInfo());
  $rows = $padDataStmt->fetchAll();
  $result["data"] = Array();
  foreach ($rows as $row) {
    $row["classes"] = explode(",", $row["classes"]);
    $result["data"][$row["row"]][$row["col"]] = $row;
  }
  $padAssStmt = $pdo->prepare("SELECT row, col, name, organization, email FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ?") or httperror($pdo->errorInfo());
  $padAssStmt->execute(Array($_REQUEST["id"])) or httperror($padDataStmt->errorInfo());
  $rows = $padAssStmt->fetchAll();
  $result["assistant"] = Array();
  foreach ($rows as $row) {
    $result["assistant"][$row["row"]][$row["col"]] = $row;
  }
 break;
 default:
  httperror("invalid action");
 break;
endswitch;

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

