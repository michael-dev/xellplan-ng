<?php

global $pdo, $DB_PREFIX;
include '../../lib/inc.all.php';

$result = Array();

switch ($_REQUEST["action"]):
 case "listPlanData":
  $padDataStmt = $pdo->prepare("SELECT row, col, text, classes, userEditField FROM ${DB_PREFIX}pad_data WHERE pad_id = ?") or httperror($pdo->errorInfo());
  $padDataStmt->execute(Array($_REQUEST["id"])) or httperror($padDataStmt->errorInfo());
  $rows = $padDataStmt->fetchAll(PDO::FETCH_ASSOC);
  $result["data"] = Array();
  foreach ($rows as $row) {
    $row["classes"] = explode(",", $row["classes"]);
    $result["data"][$row["row"]][$row["col"]] = $row;
  }
  $padAssStmt = $pdo->prepare("SELECT row, col, name, organization, email FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ?") or httperror($pdo->errorInfo());
  $padAssStmt->execute(Array($_REQUEST["id"])) or httperror($padAssStmt->errorInfo());
  $rows = $padAssStmt->fetchAll(PDO::FETCH_ASSOC);
  $result["assistant"] = Array();
  foreach ($rows as $row) {
    $result["assistant"][$row["row"]][$row["col"]] = $row;
  }
  $padWidStmt = $pdo->prepare("SELECT type, idx, width FROM ${DB_PREFIX}pad_width WHERE pad_id = ?") or httperror($pdo->errorInfo());
  $padWidStmt->execute(Array($_REQUEST["id"])) or httperror($padWidStmt->errorInfo());
  $rows = $padWidStmt->fetchAll(PDO::FETCH_ASSOC);
  $result["colWidths"] = Array();
  $result["rowHeights"] = Array();
  foreach ($rows as $row) {
    if ($row["type"] == "col") {
      $result["colWidths"][$row["idx"]] = $row["width"];
    } elseif ($row["type"] == "row") {
      $result["rowHeights"][$row["idx"]] = $row["width"];
    }
  }
  if (count($result["data"]) == 0) { $result["data"] = new stdClass(); }
  if (count($result["assistant"]) == 0) { $result["assistant"] = new stdClass(); }
  if (count($result["colWidths"]) == 0) { $result["colWidths"] = new stdClass(); }
  if (count($result["rowHeights"]) == 0) { $result["rowHeights"] = new stdClass(); }
 break;
 case "setCell":
   $planId = $_REQUEST["id"];
   $pads = $pdo->prepare("SELECT editPassword, ( (editEnd > NOW()) AND (editStart < NOW()) ) AS userEditable FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
   $pads->execute(Array($planId)) or httperror($pads->errorInfo());
   $rows = $pads->fetch(PDO::FETCH_ASSOC);
   if ($rows["userEditable"] == 0) {
     httperror("Dieser Plan ist nicht editierbar.");
   }
   if ($rows["editPassword"] === null) {
     if (empty($_REQUEST["captchaId"])) { httperror("empty captcha id supplied"); }
     if (Securimage::checkByCaptchaId($_REQUEST["captchaId"], $_REQUEST["captcha"]) != true) {
       httperror("Captcha war falsch.");
     }
   } else {
     $password = $_REQUEST["password"];
     $passwordHash = $row["editPassword"];
     if (!$pwObj->hashVerify($password, $passwordHash)) {
       httperror("Passwort war falsch.");
     }
   }
   if (empty($_REQUEST["name"])) {
     $padAssStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
     $padAssStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"], $_REQUEST["col"])) or httperror($padAssStmt->errorInfo());
   } else {
     $padAssStmt = $pdo->prepare("SELECT COUNT(*) AS ctn FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
     $padAssStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"], $_REQUEST["col"])) or httperror($padAssStmt->errorInfo());
     $rows = $padAssStmt->fetch(PDO::FETCH_ASSOC);
     if ($rows["ctn"] == 0) {
       $padAssStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_assistant (pad_id, row, col) VALUES (?, ?, ?)") or httperror($pdo->errorInfo());
       $padAssStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"], $_REQUEST["col"])) or httperror($padAssStmt->errorInfo());
     }
     foreach (Array("name","organization","email") AS $key) {
       if (!isset($_REQUEST[$key])) continue;
       $padAssStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_assistant SET $key = ? WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
       $padAssStmt->execute(Array($_REQUEST[$key], $_REQUEST["id"], $_REQUEST["row"], $_REQUEST["col"])) or httperror($padAssStmt->errorInfo());
     }
   }
   $padAssStmt = $pdo->prepare("SELECT row, col, name, organization, email FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
   $padAssStmt->execute(Array($_REQUEST["id"], $_REQUEST["row"], $_REQUEST["col"])) or httperror($padDataStmt->errorInfo());
   $row = $padAssStmt->fetch(PDO::FETCH_ASSOC);
   $result["data"] = $row;
 break;
 default:
  httperror("invalid action");
 break;
endswitch;

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

