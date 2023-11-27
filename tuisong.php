<?php
// 设置header信息
header("Content-Type: application/html; charset=utf-8");
include "config.php"; //引入配置文件

// Check connection
if ($conn->connect_error) {
    die("连接失败: " . $conn->connect_error);
}

// 查询网站配置
// 查询所有页面链接
$sql = "SELECT * FROM shors WHERE state='公开'";
$result = $conn->query($sql);
$sql1 = "SELECT * FROM posts WHERE state='公开'";
$result1 = $conn->query($sql1);
$sql2 = "SELECT * FROM user WHERE code='0'";
$result2 = $conn->query($sql2);

// 获取当前域名http开头
$protocol = isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] === "on" ? "https" : "http";
$domain = $_SERVER["HTTP_HOST"];
$domain = preg_replace('/:\d+$/', "", $domain);
$url = $protocol . "://" . $domain; // 域名
$urls = [];
// 遍历查询结果，生成每个捷径页面的XML信息
while($row = $result->fetch_assoc()) {
    $urls[] = sprintf("%s/shortcut/%s", $url, $row["sid"]);
}
// 遍历查询结果，生成每个帖子页面的XML信息
while($row1 = $result1->fetch_assoc()) {
    $urls[] = sprintf("%s/post/%s", $url, $row1["id"]);
}
// 遍历查询结果，生成每个用户主页的XML信息
while($row2 = $result2->fetch_assoc()) {
    $urls[] = sprintf("%s/user/%s", $url, $row2["uid"]);
}


// 将URL数据转换为JSON格式
$data = [
    'site' => $url,
    'token' => 'tAMm6JkFtsgdlhhk',
    'type' => 'original',
    'urls' => $urls,
];
$post_data = json_encode($data);
$post_data_array = json_decode($post_data, true); // 解码为关联数组
$urls = $post_data_array['urls'];

// 使用cURL库调用百度推送API
$api = 'http://data.zz.baidu.com/urls?site='.$url.'&token=tAMm6JkFtsgdlhhk';
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
