<?php

global $pdo, $DB_PREFIX, $isLogin, $loginMode, $attributes;
include '../../lib/inc.all.php';

$result = Array();
$planId = (int) $_REQUEST["id"];

switch ($_REQUEST["action"]):
 case "listPlanData":
  $pads = $pdo->prepare("SELECT editPassword, requireSamlLogin FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
  $pads->execute(Array($planId)) or httperror($pads->errorInfo());
  $cfgRow = $pads->fetch(PDO::FETCH_ASSOC);
  if ($cfgRow["requireSamlLogin"] && $loginMode != "basic" && !$isLogin) {
      httperror("Du warst nicht eingeloggt.");
  }
  $padDataStmt = $pdo->prepare("SELECT row, col, text, classes, userEditField FROM ${DB_PREFIX}pad_data WHERE pad_id = ?") or httperror($pdo->errorInfo());
  $padDataStmt->execute(Array($planId)) or httperror($padDataStmt->errorInfo());
  $rows = $padDataStmt->fetchAll(PDO::FETCH_ASSOC);
  $result["data"] = Array();
  foreach ($rows as $row) {
    $row["classes"] = explode(",", $row["classes"]);
    $result["data"][$row["row"]][$row["col"]] = $row;
  }

  $sql = "SELECT row, col, name, organization";
  $sqlargs = Array();
  if ($cfgRow["editPassword"] === null && !$cfgRow["requireSamlLogin"]) {
		$sql .= ", email";
  } else if ($cfgRow["editPassword"] === null && $cfgRow["requireSamlLogin"]) {
		$sql .= ", IF(ISNULL(emailByLogin),email,IF(STRCMP(emailByLogin,?),'**hidden**',email)) as email";
    $sqlArgs[] = $attributes["eduPersonPrincipalName"][0];
  }
  $sql .= " FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ?";
  $sqlArgs[] = $planId;
  $padAssStmt = $pdo->prepare($sql) or httperror($pdo->errorInfo());
  $padAssStmt->execute($sqlArgs) or httperror($padAssStmt->errorInfo());
  $rows = $padAssStmt->fetchAll(PDO::FETCH_ASSOC);
  $result["assistant"] = Array();
  foreach ($rows as $row) {
    $result["assistant"][$row["row"]][$row["col"]] = $row;
  }
  $padWidStmt = $pdo->prepare("SELECT type, idx, width FROM ${DB_PREFIX}pad_width WHERE pad_id = ?") or httperror($pdo->errorInfo());
  $padWidStmt->execute(Array($planId)) or httperror($padWidStmt->errorInfo());
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
  $padAssStmt = $pdo->prepare("SELECT eventTime, row, col, text FROM ${DB_PREFIX}pad_log WHERE pad_id = ?") or httperror($pdo->errorInfo());
  $padAssStmt->execute(Array($planId)) or httperror($padAssStmt->errorInfo());
  $result["log"]  = $padAssStmt->fetchAll(PDO::FETCH_ASSOC);
  if (count($result["data"]) == 0) { $result["data"] = new stdClass(); }
  if (count($result["assistant"]) == 0) { $result["assistant"] = new stdClass(); }
  if (count($result["colWidths"]) == 0) { $result["colWidths"] = new stdClass(); }
  if (count($result["rowHeights"]) == 0) { $result["rowHeights"] = new stdClass(); }
  if (count($result["log"]) == 0) { $result["log"] = new stdClass(); }
 break;
 case "listPlanDataEMail":
  $pads = $pdo->prepare("SELECT requireSamlLogin, editPassword FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
  $pads->execute(Array($planId)) or httperror($pads->errorInfo());
  $row = $pads->fetch(PDO::FETCH_ASSOC);
  if ($row["editPassword"] !== null) {
    $password = $_REQUEST["password"];
    $passwordHash = $row["editPassword"];
    if (!$pwObj->verifyPasswordHash($password, $passwordHash)) {
      httperror("Passwort war falsch");
    }
  }
  if ($row["requireSamlLogin"] && $loginMode != "basic" && !$isLogin) {
      httperror("Du warst nicht eingeloggt.");
  }
  $sql = "SELECT row, col, name, organization";
  $sqlargs = Array();
  if (!$row["requireSamlLogin"]) {
		$sql .= ", email";
  } else if ($row["requireSamlLogin"]) {
		$sql .= ", IF(ISNULL(emailByLogin),email,IF(STRCMP(emailByLogin,?),'**hidden**',email)) as email";
    $sqlArgs[] = $attributes["eduPersonPrincipalName"][0];
  }
  $sql .= " FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ?";
  $sqlArgs[] = $planId;

  $padAssStmt = $pdo->prepare($sql) or httperror($pdo->errorInfo());
  $padAssStmt->execute($sqlArgs) or httperror($padAssStmt->errorInfo());
  $rows = $padAssStmt->fetchAll(PDO::FETCH_ASSOC);
  $result["assistant"] = Array();
  foreach ($rows as $row) {
    $result["assistant"][$row["row"]][$row["col"]] = $row;
  }
 break;
 case "setCell":
   $pads = $pdo->prepare("SELECT requireSamlLogin, editPassword, ( (editEnd > NOW()) AND (editStart < NOW()) ) AS userEditable FROM ${DB_PREFIX}pads WHERE id = ?") or httperror($pdo->errorInfo());
   $pads->execute(Array($planId)) or httperror($pads->errorInfo());
   $cfgRow = $pads->fetch(PDO::FETCH_ASSOC);
   if ($cfgRow["userEditable"] == 0) {
     httperror("Dieser Plan ist nicht editierbar.");
   }
   if ($cfgRow["requireSamlLogin"] && $loginMode != "basic" && !$isLogin) {
      httperror("Du warst nicht eingeloggt.");
   }
   if ($cfgRow["editPassword"] === null && isset($_SESSION["skipCaptcha"]) && $_SESSION["skipCaptcha"] ) {
   } elseif ($cfgRow["editPassword"] === null) {
     // checkCaptcha($captchaId, $captcha)
     global $captchaCookie;

     if ($captchaCookie) {
       $options = array('no_exit' => true);
       $captcha = new Securimage($options);
       $captchaOk = $captcha->check($_REQUEST["captcha"]);
     } else {
       if (empty($_REQUEST["captchaId"])) { httperror("empty captcha id supplied"); }
       $captchaOk = Securimage::checkByCaptchaId($_REQUEST["captchaId"], $_REQUEST["captcha"]);
     }
     if (!$captchaOk) {
       httperror("Captcha war falsch.");
     }
     $_SESSION["skipCaptcha"] = true;
   } else {
     $password = $_REQUEST["password"];
     $passwordHash = $cfgRow["editPassword"];
     if (!$pwObj->verifyPasswordHash($password, $passwordHash)) {
       httperror("Passwort war falsch");
     }
   }

   if (isset($_REQUEST["email"]) && ($_REQUEST["email"] == "**hidden**"))
     unset($_REQUEST["email"]);

	 if (!isset($_REQUEST["email"]))
     unset($_REQUEST["emailByLogin"]);
   else if ($cfgRow["requireSamlLogin"])
     $_REQUEST["emailByLogin"] = $attributes["eduPersonPrincipalName"][0];
   else
     $_REQUEST["emailByLogin"] = NULL;

   if (empty($_REQUEST["name"])) {
     $padAssStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
     $padAssStmt->execute(Array($planId, $_REQUEST["row"], $_REQUEST["col"])) or httperror($padAssStmt->errorInfo());
     $padAssStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_log (pad_id, row, col, text) VALUES ( ?, ?, ?, ?)") or httperror($pdo->errorInfo());
     $padAssStmt->execute(Array($planId, $_REQUEST["row"], $_REQUEST["col"], '')) or httperror($padAssStmt->errorInfo());
   } else {
     $padAssStmt = $pdo->prepare("SELECT COUNT(*) AS ctn FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
     $padAssStmt->execute(Array($planId, $_REQUEST["row"], $_REQUEST["col"])) or httperror($padAssStmt->errorInfo());
     $rows = $padAssStmt->fetch(PDO::FETCH_ASSOC);
     if ($rows["ctn"] == 0) {
       $padAssStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_assistant (pad_id, row, col) VALUES (?, ?, ?)") or httperror($pdo->errorInfo());
       $padAssStmt->execute(Array($planId, $_REQUEST["row"], $_REQUEST["col"])) or httperror($padAssStmt->errorInfo());
     }
     foreach (Array("name","organization","email", "emailByLogin") AS $key) {
       if (!isset($_REQUEST[$key])) continue;
       $padAssStmt = $pdo->prepare("UPDATE ${DB_PREFIX}pad_assistant SET $key = ? WHERE pad_id = ? AND row = ? AND col = ?") or httperror($pdo->errorInfo());
       $padAssStmt->execute(Array($_REQUEST[$key], $planId, $_REQUEST["row"], $_REQUEST["col"])) or httperror($padAssStmt->errorInfo());
     }
     $padAssStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}pad_log (pad_id, row, col, text) VALUES ( ?, ?, ?, ?)") or httperror($pdo->errorInfo());
     $padAssStmt->execute(Array($planId, $_REQUEST["row"], $_REQUEST["col"], $_REQUEST["name"])) or httperror($padAssStmt->errorInfo());
   }

   $sql = "SELECT row, col, name, organization";
   $sqlargs = Array();
   if ($cfgRow["editPassword"] === null && !$cfgRow["requireSamlLogin"]) {
		 $sql .= ", email";
	 } else if ($cfgRow["editPassword"] === null && $cfgRow["requireSamlLogin"]) {
	 	 $sql .= ", IF(ISNULL(emailByLogin),email,IF(STRCMP(emailByLogin,?),'**hidden**',email)) as email";
     $sqlArgs[] = $attributes["eduPersonPrincipalName"][0];
	 }
   $sql .= " FROM ${DB_PREFIX}pad_assistant WHERE pad_id = ? AND row = ? AND col = ?";
   $sqlArgs[] = $planId;
   $sqlArgs[] = $_REQUEST["row"];
   $sqlArgs[] = $_REQUEST["col"];

   $padAssStmt = $pdo->prepare($sql) or httperror($pdo->errorInfo());
   $padAssStmt->execute($sqlArgs) or httperror($padAssStmt->errorInfo());
   $row = $padAssStmt->fetch(PDO::FETCH_ASSOC);
   $result["data"] = $row;
 break;
 default:
  httperror("invalid action");
 break;
endswitch;

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

