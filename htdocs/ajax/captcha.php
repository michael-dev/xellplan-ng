<?php

include '../../lib/inc.all.php';

$result = Array();
global $captchaCookie;

if ($captchaCookie) {
  $captchaId = null;
  $options = array('no_exit' => true);
} else {
  $captchaId = Securimage::getCaptchaId();
  $options = array('captchaId'  => $captchaId, 'no_session' => true, 'no_exit' => true);
}

$captcha = new Securimage($options);
ob_start();   // start the output buffer
$captcha->show();
$imgBinary = ob_get_contents(); // get contents of the buffer
ob_end_clean(); // turn off buffering and clear the buffer

$result["id"] = $captchaId;
$result["img"] = base64_encode($imgBinary);
$result["mime"] = "image/png";

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);
