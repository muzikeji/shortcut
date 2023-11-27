<?php include "header.php"; //引入头部文件 ?>
<div class="wrapper">
    <div class="swiper-container">
        <div class="swiper-wrapper">
            <div class="swiper-slide">
                <button type="button" class="btn btn-primary btn-block category" data-filter="all">全部</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-success btn-block category" data-filter="工具">工具</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-info btn-block category" data-filter="娱乐">娱乐</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-warning btn-block category" data-filter="效率">效率</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-danger btn-block category" data-filter="视频">视频</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-secondary btn-block category" data-filter="音乐">音乐</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-primary btn-block category" data-filter="阅读">阅读</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-success btn-block category" data-filter="生活">生活</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-info btn-block category" data-filter="社交">社交</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-warning btn-block category" data-filter="图片">图片</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-danger btn-block category" data-filter="开发者">开发者</button>
            </div>
            <div class="swiper-slide">
                <button type="button" class="btn btn-secondary btn-block category" data-filter="资讯">资讯</button>
            </div>
        </div>
    </div>
</div>
<div class="row" id="app-list">
    <?php
        $sql = "SELECT shors.*, user.name as author_name FROM shors JOIN user ON shors.author = user.uid WHERE shors.state='已审核' ORDER BY RAND()";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                echo '<div class="app-item ' . $row["class"] . '">';
                echo '<div class="cards" >';
                echo '<div class="box" style="background-color: #' . $row["bg"] . ';">';
                echo '<a class="text-decoration-none text-reset" href="'.$url.'/shortcut/' . $row["sid"] . '">';
echo '<div class="jjlogo" style="color:#fff"><i class="fas fa-' . $row["logo"] . ' fa-2x"></i></div>';
                echo '<h2 class="name">' . $row["name"] . '</h2>';
                echo '<p style="font-family: Arial, sans-serif;color: #f7f7f7;" class="description" id="my-description">' . $row["content"] . '</p>';
                echo '<div class="info">';
                echo '<span class="author"><i class="fa fa-user-alt"></i>&nbsp;&nbsp;' . $row["author_name"] . '</span>';
                echo '<span class="cate"><i class="fa fa-list"></i>&nbsp;&nbsp;' . $row["class"] . '</span>';
                echo '<span class="downloads"><i class="fa fa-download"></i>&nbsp;&nbsp;' . $row["dow"] . '</span>';
                echo '</div>';
                echo '</a>';
                echo '</div>';
                echo '</div>';
                echo '</div>';
            }
        } else {
            echo "暂无应用";
        }
                echo '</div>';
                echo '</div>';
        $conn->close();


include "footer.php"; //引入配置文件
 ?>
