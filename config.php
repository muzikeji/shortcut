<?php
//配置php
    header("Content-type:text/html;charset=utf-8");
$defaultOpts = [
  'ssl' => [
    'verify_peer' => false,
    'verify_peer_name' => false,
  ]
];
stream_context_set_default($defaultOpts);
$admin = "56794501";
$ikey="MKEYXKMDFGDH5JA6";
$root = "https://fler.cn";

$servername = "114.55.146.133";
$username = "jiejin";
$password = "Dch520898";
$dbname = "jiejin";
$conn = new mysqli($servername, $username, $password, $dbname);

//查询网站配置
$sql = "SELECT * FROM conf WHERE id = 1";

// 执行查询
$result = $conn->query($sql);

// 检查查询结果是否为空
if ($result->num_rows > 0) {
    // 如果有数据，将每一行的数据存储在 $row 变量中
    $rows = array();
    while($row = $result->fetch_assoc()) {
        // 将每一行的数据存储在一个关联数组中
        $row_data = array(
            "id" => $row["id"],
            "title" => $row["title"],
            "admin" => $row["admin"],
            "pwd" => $row["pwd"],
            "domain" => $row["domain"],
            "seotitle" => $row["seotitle"],
            "logo" => $row["logo"],
            "qq" => $row["qq"],
            "keywords" => $row["keywords"],
            "description" => $row["description"],
           "webhook" => $row["webhook"]
        );
        // 将这个关联数组存储在一个数组中
        $conf = $row_data;
    }
    // 打印查询结果
} else {
    echo "没有数据";
}
//获取当前域名http开头
$protocol = isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] === "on" ? "https" : "http";
$domain = $_SERVER["HTTP_HOST"];
$domain = preg_replace('/:\d+$/', "", $domain);
$url = $protocol . "://" . $domain; //域名
?>