<?php


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
            "description" => $row["description"]


        );
        // 将这个关联数组存储在一个数组中
        $conf = $row_data;
    }
    // 打印查询结果
} else {
    echo "没有数据";
}


?>
