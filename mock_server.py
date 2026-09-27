import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
ARTIFACT_PATH = ROOT_DIR / 'RoadmapsApp-3.0.6.exe'
LATEST_PATH = ROOT_DIR / 'latest.json'
ARTIFACT_SIZE = 50 * 1024 * 1024


def prepare_mock_release():
    with ARTIFACT_PATH.open('wb') as artifact:
        remaining = ARTIFACT_SIZE
        while remaining:
            chunk_size = min(1024 * 1024, remaining)
            artifact.write(os.urandom(chunk_size))
            remaining -= chunk_size

    release = {
        'version': '3.0.6',
        'is_force_update': False,
        'download_url': 'http://127.0.0.1:8000/RoadmapsApp-3.0.6.exe',
        'changelog': 'Forced update test',
        'sha256': '',
    }
    LATEST_PATH.write_text(json.dumps(release), encoding='utf-8')


class MockReleaseHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)


if __name__ == '__main__':
    prepare_mock_release()
    server = ThreadingHTTPServer(('127.0.0.1', 8000), MockReleaseHandler)
    print('Mock update server listening on http://127.0.0.1:8000')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopping mock update server.')
    finally:
        server.server_close()