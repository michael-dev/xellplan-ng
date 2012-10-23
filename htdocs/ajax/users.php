<?php

global $pdo, $DB_PREFIX, $pwObj;
include '../../lib/inc.all.php';

if (isset($_SERVER['PHP_AUTH_USER'])) {
  $userStmt = $pdo->prepare("SELECT password FROM ${DB_PREFIX}users WHERE admin AND email = ?");
  $userStmt->execute($_SERVER['PHP_AUTH_USER']);
  $res = $userStmt->fetchAll();
  if (is_array($res) && count($res) == 1) {
    $passwordHash = $res[0]["password"];
    $password = $_SERVER['PHP_AUTH_PW'];
    if (!$pwObj->hashVerify($password, $passwordHash)) {
      unset($_SERVER['PHP_AUTH_USER']);
    }
  } else {
    unset($_SERVER['PHP_AUTH_USER']);
  }
}

if (!isset($_SERVER['PHP_AUTH_USER'])) {
    header('WWW-Authenticate: Basic realm="XellPlan-NG"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'Admin-Rechte für Nutzerverwaltung benötigt.';
    exit;
}

$users = $pdo->query("SELECT email, password, admin FROM ${DB_PREFIX}users");
$groups = $pdo->query("SELECT id FROM ${DB_PREFIX}groups");
$grpMembers = $pdo->query("SELECT email, group_id FROM ${DB_PREFIX}rel_user_group");

$result = Array();

$result["groups"] = Array();
foreach ($groups as $row) {
  $result["groups"][$row["id"]] = $row;
  $result["groups"][$row["id"]]["members"] = Array();
}

$result["users"] = Array();
foreach ($users as $row) {
  $result["users"][$row["email"]] = $row;
  $result["users"][$row["email"]]["groups"] = Array();
}

foreach ($grpMembers as $row) {
  $result["groups"][$row["group_id"]]["members"][] = $row["email"];
  $result["users"][$row["email"]]["groups"][] = $row["group_id"];
}

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

