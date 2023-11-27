<?php
$servername = "114.55.146.133";
$username = "jiejin";
$password = "Dch520898";
$dbname = "jiejin";
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("连接失败: " . $conn->connect_error);
//查询网站配置
}
// 查询所有页面链接
$sql = "SELECT * FROM shors WHERE state='公开'";
$result = $conn->query($sql);
$sql1 = "SELECT * FROM posts WHERE state='公开'";
$result1 = $conn->query($sql1);
$sql2 = "SELECT * FROM user WHERE code='0'";
$result2 = $conn->query($sql2);
//获取当前域名http开头
$protocol = isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] === "on" ? "https" : "http";
$domain = $_SERVER["HTTP_HOST"];
$domain = preg_replace('/:\d+$/', "", $domain);
$url = $protocol . "://" . $domain;//域名
// 设置header信息
header("Content-Type: application/xml; charset=utf-8");

// 开始生成XML数据
echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
echo "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
    echo "<url>\n";
    echo "<loc>".$url."</loc>\n";
    echo "<lastmod>" . date("Y-m-d") . "</lastmod>\n";
    echo "<changefreq>weekly</changefreq>\n";
    echo "<priority>1.0</priority>\n";
    echo "</url>\n";
// 遍历查询结果，生成每个捷径页面的XML信息
while($row = $result->fetch_assoc()) {
    echo "<url>\n";
    echo "<loc>".$url."/shortcut/" . $row["sid"] . "</loc>\n";
    echo "<lastmod>" . date("Y-m-d", strtotime($row["date"])) . "</lastmod>\n";
    echo "<changefreq>weekly</changefreq>\n";
    echo "<priority>0.9</priority>\n";
    echo "</url>\n";
}
// 遍历查询结果，生成每个帖子页面的XML信息
while($row1 = $result1->fetch_assoc()) {
    echo "<url>\n";
    echo "<loc>".$url."/post/" . $row1["id"] . "</loc>\n";
    echo "<lastmod>" . date("Y-m-d", strtotime($row1["create_time"])) . "</lastmod>\n";
    echo "<changefreq>weekly</changefreq>\n";
    echo "<priority>0.8</priority>\n";
    echo "</url>\n";
}
// 遍历查询结果，生成每个用户主页的XML信息
while($row2 = $result2->fetch_assoc()) {
    echo "<url>\n";
    echo "<loc>".$url."/user/" . $row2["uid"] . "</loc>\n";
    echo "<lastmod>" . date("Y-m-d", strtotime($row2["time"])) . "</lastmod>\n";
    echo "<changefreq>daily</changefreq>\n";
    echo "<priority>0.7</priority>\n";
    echo "</url>\n";
}

// 结束XML数据
echo "</urlset>";

// 关闭数据库连接
$conn->close();
?>
