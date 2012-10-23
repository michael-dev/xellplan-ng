<?php

global $pdo, $DB_PREFIX;
include '../../lib/inc.all.php';

if (isset($_SERVER['PHP_AUTH_USER'])) {
  $userStmt = $pdo->prepare("SELECT password FROM ${DB_PREFIX}users WHERE admin AND email = ?");
  $userStmt->execute($_SERVER['PHP_AUTH_USER']);
  $res = $userStmt->fetchAll();
  if (is_array($res) && count($res) == 1) {
    $passwordHash = $res[0]["password"];
    $password = $_SERVER['PHP_AUTH_PW'];

if (!isset($_SERVER['PHP_AUTH_USER'])) {
    header('WWW-Authenticate: Basic realm="My Realm"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'Text, der gesendet wird, falls der Benutzer auf Abbrechen drückt';
    exit;
} else {

$users = $pdo->query("SELECT email, password, admin FROM ${DB_PREFIX}users");
$pads = $pdo->query("SELECT group_id, section_id, id, * FROM ${DB_PREFIX}pads WHERE section_id != ''");

$result = Array();

foreach ($grps as $row) {
  $result[$row["id"]] = Array();
}

foreach ($pads as $row) {
  $result[$row["group_id"]][$row["section_id"]][$row["id"]] = $row;
}

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

