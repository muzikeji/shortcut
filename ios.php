<?php

// 要获取的分享链接
$link = "https://www.icloud.com/shortcuts/a0da58e0e0c049658b59026d8bbe4fcd";

// 使用cURL获取链接内容
$curl = curl_init($link);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
$content = curl_exec($curl);

// 使用正则表达式提取操作内容
preg_match('/<pre.*?>(.*?)<\/pre>/s', $content, $matches);
$operation = $matches[1];

var_dump($operation); // 输出操作内容
?>


