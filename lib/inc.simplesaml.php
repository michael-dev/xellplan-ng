<?php

global $SIMPLESAML, $SIMPLESAMLAUTHSOURCE, $attributes, $logoutUrl, $loginUrl, $loginMode, $isLogin;

$isLogin = false;
if ($loginMode != "basic") {
 require_once($SIMPLESAML.'/lib/_autoload.php');
 $as = new SimpleSAML_Auth_Simple($SIMPLESAMLAUTHSOURCE); 
 $url = NULL;
 if (isset($_REQUEST["url"])) { $url = $_REQUEST["url"]; }
 if ($as->isAuthenticated()) {
  $_SESSION["skipCaptcha"] = true;
  $attributes = $as->getAttributes();
  $isLogin = true;
 } else {
  $attributes = NULL;
 }
 $logoutUrl = $as->getLogoutURL($url);
 $loginUrl = $as->getLoginURL($url);
}


