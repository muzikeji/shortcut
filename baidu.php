<?php
include "config.php"; //引入配置文件
include "conf.php"; //引入配置文件

// 查询所有页面链接
$sql = "SELECT * FROM shors WHERE state='已审核'";
$result = $conn->query($sql);

// 将每个页面的链接添加到数组中
$urls = array();
while($row = $result->fetch_assoc()) {
    $urls[] = $url . "/shortcut/" . $row["sid"];
}

// 设置header信息
header("Content-Type: application/xml; charset=utf-8");

$api = 'http://data.zz.baidu.com/urls?site=https://fler.cn&token=KIzLC2jQ4qIVxgVl';
$ch = curl_init();
$options =  array(
    CURLOPT_URL => $api,
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POSTFIELDS => implode("\n", $urls),
    CURLOPT_HTTPHEADER => array('Content-Type: text/plain'),
);
curl_setopt_array($ch, $options);
$result = curl_exec($ch);
echo $result;

// 关闭数据库连接
$conn->close();

?>
