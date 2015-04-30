<?php
global $loginMode, $attributes, $loginUrl, $logoutUrl, $orgs;

include '../../lib/inc.all.php';
$result = Array();
$result["loginMode"] = $loginMode;
if ($loginMode != "basic") {
  $result["isAuth"] = ($attributes !== NULL);
  $result["email"] = $attributes["mail"][0];
}
$result["loginMode"] = $loginMode;
$result["loginUrl"] = $loginUrl;
$result["logoutUrl"] = $logoutUrl;
$result["orgs"] = $orgs;
$result["needCaptcha"] = !(isset($_SESSION["skipCaptcha"]) && $_SESSION["skipCaptcha"]);

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);
