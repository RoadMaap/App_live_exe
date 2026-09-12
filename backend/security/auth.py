import json
import webbrowser
import http.server
import socketserver
import urllib.parse
import threading
import time
import secrets
import hashlib
import base64
import requests
from urllib.parse import urlencode

# PKCE-enabled desktop auth client for RoadMaps
WEBSITE_BASE_URL = "https://roadmaps.ir"
WEBSITE_LOGIN_URL = f"{WEBSITE_BASE_URL}/auth/login"
PKCE_START_URL = f"{WEBSITE_BASE_URL}/api/v1/users/auth/pkce/start/"
PKCE_TOKEN_URL = f"{WEBSITE_BASE_URL}/api/v1/users/auth/pkce/token/"
LOCAL_AUTH_PORT = 0  # 0 -> random free port


class AuthHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/auth':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            code = query_params.get('code', [None])[0]
            state = query_params.get('state', [None])[0]

            if code:
                self.server.received_code = code
                self.server.received_state = state
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                success_html = """
                <html>
                <body style="background:#09090b; color:#10b981; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; text-align:center;">
                    <div>
                        <h1 style="font-size:2.5rem; margin-bottom:10px;">Login Successful! ✅</h1>
                        <p style="color:#a1a1aa;">Authentication complete. You can close this browser tab and return to the app.</p>
                        <script>setTimeout(() => window.close(), 1500);</script>
                    </div>
                </body>
                </html>
                """
                self.wfile.write(success_html.encode('utf-8'))
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Error: No code received.")
            threading.Thread(target=self.server.shutdown).start()
        else:
            self.send_response(404)
            self.end_headers()


class DesktopAuthServer:
    def __init__(self):
        self.token = None
        self.code_verifier = None
        self.auth_code = None

    def build_login_url(self, callback_port, state=None):
        params = {"callback_port": str(callback_port)}
        if state:
            params["device_state"] = state
        sep = "&" if "?" in WEBSITE_LOGIN_URL else "?"
        return f"{WEBSITE_LOGIN_URL}{sep}{urlencode(params)}"

    def _request_json(self, url, payload=None, method="GET", timeout=15):
        try:
            headers = {"Accept": "application/json"}
            if payload is not None:
                headers["Content-Type"] = "application/json"
                resp = requests.request(method, url, json=payload, headers=headers, timeout=timeout)
            else:
                resp = requests.request(method, url, headers=headers, timeout=timeout)
            resp.raise_for_status()
            if not resp.text:
                return {}
            return resp.json()
        except requests.RequestException as e:
            raise

    def wait_for_login(self, timeout_seconds=300):
        socketserver.TCPServer.allow_reuse_address = True
        try:
            httpd = socketserver.TCPServer(("localhost", LOCAL_AUTH_PORT), AuthHandler)
        except Exception as e:
            return False, f"Server Error: Could not bind to local port. {e}"

        assigned_port = httpd.server_address[1]
        httpd.received_code = None

        # Generate PKCE code_verifier and code_challenge
        self.code_verifier = secrets.token_urlsafe(64)
        m = hashlib.sha256()
        m.update(self.code_verifier.encode('ascii'))
        code_challenge = base64.urlsafe_b64encode(m.digest()).rstrip(b'=').decode('ascii')

        # Start PKCE request on backend
        pkce_payload = {
            'callback_port': int(assigned_port),
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
        }

        try:
            result = self._request_json(PKCE_START_URL, payload=pkce_payload, method='POST')
        except Exception as exc:
            result = None

        login_url = None
        if result and result.get('success') and result.get('login_url'):
            login_url = result.get('login_url')
        else:
            login_url = self.build_login_url(assigned_port, None)

        try:
            webbrowser.open(login_url)
        except Exception as e:
            httpd.server_close()
            return False, f"Could not open browser: {e}"

        try:
            ThreadingServer = socketserver.ThreadingTCPServer
        except AttributeError:
            ThreadingServer = socketserver.TCPServer

        if not isinstance(httpd, ThreadingServer):
            httpd.server_close()
            httpd = ThreadingServer(("localhost", assigned_port), AuthHandler)
            httpd.received_code = None

        server_thread = threading.Thread(target=httpd.serve_forever)
        server_thread.daemon = True
        server_thread.start()

        start_time = time.time()
        while getattr(httpd, 'received_code', None) is None:
            if time.time() - start_time > timeout_seconds:
                httpd.shutdown()
                httpd.server_close()
                return False, "Login timed out. Please try again."
            time.sleep(0.5)

        # We have an authorization code from loopback
        auth_code = httpd.received_code
        state = getattr(httpd, 'received_state', None)

        # Exchange authorization code for tokens
        try:
            resp = requests.post(PKCE_TOKEN_URL, json={'code': auth_code, 'code_verifier': self.code_verifier}, timeout=15)
            resp.raise_for_status()
            body = resp.json()
            tokens = body.get('tokens') or body.get('data') or {}
            access = tokens.get('access') or tokens.get('access_token') or tokens.get('token')
            if access:
                self.token = access
        except Exception:
            pass

        httpd.shutdown()
        httpd.server_close()
        return True, "Authentication Successful"


def start_web_auth_flow():
    auth_server = DesktopAuthServer()
    success, message = auth_server.wait_for_login(timeout_seconds=300)
    return success, message, auth_server.token


if __name__ == "__main__":
    print("Starting local desktop auth flow. A browser window will open to complete login.")
    ok, msg, token = start_web_auth_flow()
    print(f"Success: {ok}, message: {msg}")
    if token:
        print(f"Received token: {token}")
    else:
        print("No token received.")