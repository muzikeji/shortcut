<?php
include "config.php"; // 引入数据库配置文件


// 使用 file_get_contents 函数获取请求体中的 JSON 数据
$request_data = file_get_contents('php://input');

// 使用 json_decode 函数将 JSON 数据解析为 PHP 数组或对象
$data = json_decode($request_data, true);

// 获取作品ID和用户ID
$sid = $data['sid'];
$uid = $data['uid'];

if (empty($uid)) {
    // 如果用户ID为空，返回错误信息
    $response = array(
        'status' => 'error',
        'message' => '请登录后再点赞！'
    );
    echo json_encode($response); // 输出响应信息
    exit(); // 终止脚本的继续执行
}

// 查询作品是否已经存在
$query = "SELECT * FROM works WHERE id=$sid";
$result = mysqli_query($conn, $query);
if (mysqli_num_rows($result) > 0) {
    // 如果作品已经存在，查询用户是否已经点赞过该作品
    $query = "SELECT * FROM likes WHERE sid=$sid AND uid=$uid";
    $result = mysqli_query($conn, $query);
    if (mysqli_num_rows($result) > 0) {
        // 如果已经点赞过，返回已经点赞的信息
        $response = array(
            'status' => 'error',
            'message' => '你已经点赞过该作品了！'
        );
    } else {
        // 如果没有点赞过，添加点赞记录到数据库中
        $query = "INSERT INTO likes (sid, uid) VALUES ($sid, $uid)";
        mysqli_query($conn, $query);

        // 更新作品点赞数
        $query = "UPDATE works SET like_count=like_count+1 WHERE id=$sid";
        mysqli_query($conn, $query);

        // 查询作品点赞数
        $query = "SELECT like_count FROM works WHERE id=$sid";
        $result = mysqli_query($conn, $query);
        $row = mysqli_fetch_assoc($result);
        $like_count = $row['like_count'];

        // 返回点赞成功的信息和点赞数
        $response = array(
            'status' => 'success',
            'message' => '点赞成功！',
            'count' => $like_count
        );
    }
} else {
    // 如果作品不存在，先插入作品记录，再更新点赞数
    $query = "INSERT INTO works (id, like_count) VALUES ($sid, 1)";
    mysqli_query($conn, $query);

    // 添加点赞记录到数据库中
    $query = "INSERT INTO likes (sid, uid) VALUES ($sid, $uid)";
    mysqli_query($conn, $query);

    // 查询作品点赞数
    $query = "SELECT like_count FROM works WHERE id=$sid";
    $result = mysqli_query($conn, $query);
    $row = mysqli_fetch_assoc($result);
    $like_count = $row['like_count'];

    // 返回点赞成功的信息和点赞数
    $response = array(
        'status' => 'success',
        'message' => '点赞成功！',
        'count' => $like_count
    );
}

// 关闭数据库链接
mysqli_close($conn);

// 输出JSON格式的响应信息
header('Content-Type: application/json');
echo json_encode($response);
?>
