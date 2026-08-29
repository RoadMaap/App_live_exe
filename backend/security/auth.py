import webbrowser
import http.server
import socketserver
import urllib.parse
import urllib.error
import threading
import time

# آدرس صفحه لاگین سایت شما
WEBSITE_LOGIN_URL = "https://yourwebsite.com/desktop-login"
# استفاده از پورت 0 باعث می‌شود ویندوز یک پورت کاملاً خالی و تصادفی به برنامه اختصاص دهد (جلوگیری از تداخل)
LOCAL_AUTH_PORT = 0 

class AuthHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass # غیرفعال کردن لاگ‌های اضافه در ترمینال

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == '/auth':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            token = query_params.get('token', [None])[0]
            
            if token:
                self.server.received_token = token
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                
                success_html = """
                <html>
                <body style="background:#09090b; color:#10b981; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; text-align:center;">
                    <div>
                        <h1 style="font-size:2.5rem; margin-bottom:10px;">Login Successful! ✅</h1>
                        <p style="color:#a1a1aa;">Authentication complete. You can close this browser tab and return to the RoadMap Terminal.</p>
                        <script>setTimeout(() => window.close(), 3000);</script>
                    </div>
                </body>
                </html>
                """
                self.wfile.write(success_html.encode('utf-8'))
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Error: No token received.")
            
            threading.Thread(target=self.server.shutdown).start()
        else:
            self.send_response(404)
            self.end_headers()

class DesktopAuthServer:
    def __init__(self):
        self.token = None

    def wait_for_login(self, timeout_seconds=120):
        socketserver.TCPServer.allow_reuse_address = True
        
        try:
            httpd = socketserver.TCPServer(("localhost", LOCAL_AUTH_PORT), AuthHandler)
        except Exception as e:
            return False, f"Server Error: Could not bind to local port. {e}"

        # استخراج پورتی که ویندوز به صورت اتوماتیک اختصاص داده است
        assigned_port = httpd.server_address[1]
        httpd.received_token = None

        # ارسال پورت داینامیک به سایت، تا سایت بداند جواب را به کجا بفرستد
        dynamic_login_url = f"{WEBSITE_LOGIN_URL}?callback_port={assigned_port}"

        try:
            webbrowser.open(dynamic_login_url)
        except Exception as e:
            httpd.server_close()
            return False, f"Could not open browser: {e}"

        server_thread = threading.Thread(target=httpd.serve_forever)
        server_thread.daemon = True
        server_thread.start()

        start_time = time.time()
        while httpd.received_token is None:
            if time.time() - start_time > timeout_seconds:
                httpd.shutdown()
                httpd.server_close()
                return False, "Login timed out. Please try again."
            time.sleep(1)

        self.token = httpd.received_token
        httpd.server_close()
        
        return True, "Authentication Successful"

def start_web_auth_flow():
    auth_server = DesktopAuthServer()
    success, message = auth_server.wait_for_login(timeout_seconds=300) 
    return success, message, auth_server.token