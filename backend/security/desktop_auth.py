import base64
import hashlib
import http.server
import json
import os
import secrets
import socketserver
import threading
import time
import urllib.parse
import webbrowser
import requests
from requests.exceptions import RequestException, JSONDecodeError

# All inline and block comments are strictly written in professional English.

# Ensure no leading slash before http and keep trailing slashes intact
BACKEND_BASE_URL = os.getenv("ROADMAPS_BACKEND_URL", "http://localhost").rstrip('/')
PKCE_START_URL = f"{BACKEND_BASE_URL}/api/v1/users/auth/pkce/start/"
PKCE_TOKEN_URL = f"{BACKEND_BASE_URL}/api/v1/users/auth/pkce/token/"

LOCAL_AUTH_PORT = 0  # 0 allows OS to dynamically bind to any free port


class AuthHandler(http.server.SimpleHTTPRequestHandler):
    """Captures the loopback authorization code redirected from browser."""

    def log_message(self, format, *args):
        # Suppress logging in production/dev console
        pass

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)

        if parsed_path.path == '/auth':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            code = query_params.get('code', [None])[0]
            state = query_params.get('state', [None])[0]

            if code and state:
                self.server.received_code = code
                self.server.received_state = state

                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()

                success_html = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Authentication Successful</title>
                    <style>
                        body {
                            background-color: #09090b;
                            color: #10b981;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            text-align: center;
                        }
                        .container {
                            border: 1px solid rgba(255,255,255,0.1);
                            padding: 32px 48px;
                            border-radius: 16px;
                            background: rgba(18, 18, 21, 0.8);
                        }
                        h1 { font-size: 24px; margin-bottom: 8px; }
                        p { color: #a1a1aa; font-size: 14px; margin: 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Login Successful! ✅</h1>
                        <p>Authentication complete. Returning to RoadMap Terminal...</p>
                    </div>
                    <script>setTimeout(() => window.close(), 1500);</script>
                </body>
                </html>
                """
                self.wfile.write(success_html.encode('utf-8'))
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Error: Missing authorization code or state.")

            # Safely shutdown the server in a separate thread to allow response completion
            threading.Thread(target=self.server.shutdown).start()
        else:
            self.send_response(404)
            self.end_headers()


class DesktopAuthClient:
    """Handles client-side PKCE generation, system browser lifecycle, and token exchange."""

    def __init__(self):
        self.device_state = None
        
        # Initialize a requests Session with default headers
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})
        self.timeout = 15

    def _generate_pkce_credentials(self):
        """Generates cryptographically secure code_verifier and code_challenge."""
        code_verifier = secrets.token_urlsafe(64)
        digest = hashlib.sha256(code_verifier.encode('ascii')).digest()
        code_challenge = base64.urlsafe_b64encode(digest).rstrip(b'=').decode('ascii')
        return code_verifier, code_challenge

    def wait_for_login(self, timeout_seconds=180):
        """Initiates flow, waits for user login, and returns the complete token payload."""
        socketserver.TCPServer.allow_reuse_address = True

        try:
            httpd = socketserver.TCPServer(("localhost", LOCAL_AUTH_PORT), AuthHandler)
        except OSError as exc:
            return False, f"Could not bind to local port: {exc}", None

        assigned_port = httpd.server_address[1]
        httpd.received_code = None
        httpd.received_state = None

        code_verifier, code_challenge = self._generate_pkce_credentials()

        # 1. Request PKCE session start from backend
        pkce_payload = {
            'callback_port': int(assigned_port),
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
        }

        try:
            response = self.session.post(PKCE_START_URL, json=pkce_payload, timeout=self.timeout)
            response.raise_for_status()
            session_data = response.json()
        except RequestException as exc:
            httpd.server_close()
            return False, f"Backend connection failed: {exc}", None
        except JSONDecodeError:
            httpd.server_close()
            return False, "Failed to decode backend JSON response.", None

        login_url = session_data.get('login_url')
        self.device_state = session_data.get('state')

        # Strictly use backend-provided login_url without modification
        if not login_url or not self.device_state:
            httpd.server_close()
            return False, "Failed to retrieve valid login URL or state from backend.", None

        # 2. Open login page in default browser
        try:
            webbrowser.open(login_url)
        except webbrowser.Error as exc:
            httpd.server_close()
            return False, f"Failed to launch browser: {exc}", None

        # 3. Spin up local server listener
        server_thread = threading.Thread(target=httpd.serve_forever)
        server_thread.daemon = True
        server_thread.start()

        # 4. Wait for loopback code
        start_time = time.time()
        while getattr(httpd, 'received_code', None) is None:
            if time.time() - start_time > timeout_seconds:
                httpd.shutdown()
                httpd.server_close()
                return False, "Login timed out. Please try again.", None
            time.sleep(0.5)

        auth_code = httpd.received_code
        received_state = httpd.received_state
        
        httpd.shutdown()
        httpd.server_close()

        # 5. Security Check: Validate state parameter to prevent CSRF attacks
        if received_state != self.device_state:
            return False, "Security error: State mismatch. Authentication aborted.", None

        # 6. Exchange code for JWT tokens and user profile
        try:
            exchange_payload = {
                'code': auth_code,
                'code_verifier': code_verifier,
            }
            token_resp = self.session.post(PKCE_TOKEN_URL, json=exchange_payload, timeout=self.timeout)
            token_resp.raise_for_status()
            data = token_resp.json()

            # Extract the exact 'tokens' object defined in backend contract
            tokens = data.get('tokens')
            
            if not tokens or not tokens.get('access'):
                return False, "Tokens missing in exchange payload.", None

            return True, "Authentication successful.", tokens

        except RequestException as exc:
            return False, f"Token exchange failed: {exc}", None
        except JSONDecodeError:
            return False, "Token exchange failed: Invalid JSON response.", None


def start_web_auth_flow():
    """Entry point to execute desktop authentication flow and return user data."""
    client = DesktopAuthClient()
    success, message, tokens_data = client.wait_for_login(timeout_seconds=180)
    
    return {
        "success": success,
        "message": message,
        "user_data": tokens_data  # Contains access, refresh, email, username, etc.
    }