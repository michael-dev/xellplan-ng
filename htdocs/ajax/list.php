<?php

global $pdo, $DB_PREFIX;
include '../../lib/inc.all.php';

$grps = $pdo->query("SELECT id FROM ${DB_PREFIX}groups") or die(print_r($pdo->errorInfo(),true));
$pads = $pdo->query("SELECT group_id, section_id, id, name, comment, eventStart, eventEnd, editStart, editEnd, creator, editPassword FROM ${DB_PREFIX}pads WHERE section_id != ''") or die(print_r($pdo->errorInfo(),true));

$result = Array();

foreach ($grps as $row) {
  $result[$row["id"]] = Array();
}

foreach ($pads as $row) {
  $result[$row["group_id"]][$row["section_id"]][$row["id"]] = $row;
}

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

