<!DOCTYPE html>
<html>
<head>
    <title>OpenAI Chat Interface</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
    <style>
        .chat-container {
            max-width: 800px;
            margin: auto;
            margin-top: 50px;
            border: 1px solid #ccc;
            padding: 20px;
            border-radius: 5px;
            overflow-y: scroll;
            height: 400px;
        }
        .chat-message {
            margin-bottom: 10px;
        }
        .chat-message .user {
            font-weight: bold;
            margin-right: 10px;
        }
        .chat-message .content {
            background-color: #f2f2f2;
            padding: 10px;
            border-radius: 10px;
            display: inline-block;
            max-width: 70%;
        }
        .chat-form {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="chat-container">
            <div class="chat-message">
                <span class="user">AMA:</span>
                <span class="content">Welcome to the OpenAI chat interface. How may I assist you?</span>
            </div>
        </div>
        <form class="chat-form">
            <div class="form-group">
                <label for="message">Your message:</label>
                <input type="text" class="form-control" id="message" placeholder="Type your message here...">
            </div>
            <button type="submit" class="btn btn-primary">Send</button>
        </form>
    </div>
    <script>
        $(function() {
            $('form.chat-form').submit(function(e) {
                e.preventDefault();
                var message = $('#message').val();
                $.ajax({
                    type: "POST",
                    url: "your_api_url_here",
                    data: {
                        text: message
                    },
                    success: function(result) {
                        var response = result.data;
                        var html = '<div class="chat-message">';
                        html += '<span class="user">You:</span>';
                        html += '<span class="content">' + message + '</span>';
                        html += '</div>';
                        html += '<div class="chat-message">';
                        html += '<span class="user">AMA:</span>';
                        html += '<span class="content">' + response + '</span>';
                        html += '</div>';
                        $('form.chat-form').before(html);
                        $('#message').val('');
                        $(".chat-container").scrollTop($(".chat-container")[0].scrollHeight);
                    },
                    error: function(xhr, status, error) {
                        console.log(xhr.responseText);
                    }
                });
            });
        });
    </script>
</body>
</html>
