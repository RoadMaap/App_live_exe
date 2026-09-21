import hashlib
import json
import os
import shutil
import tempfile
import time
import urllib.request
from pathlib import Path


APP_VERSION = "0.0.0"
RELEASE_API_URL = os.environ.get(
    "ROADMAPS_APP_RELEASE_API_URL",
    "https://roadmaps.ir/api/v1/roadmapsapp/releases/latest/",
)

BACKEND_DIR = Path(__file__).resolve().parents[1]
APP_ROOT_DIR = BACKEND_DIR.parent
APP_STORAGE_DIR = APP_ROOT_DIR / ".roadmaps_app"
RELEASES_DIR = APP_STORAGE_DIR / "releases"
BACKUP_DIR = APP_STORAGE_DIR / "backups"
CURRENT_VERSION_FILE = APP_STORAGE_DIR / "current_version.txt"
UPDATE_LOG_FILE = APP_STORAGE_DIR / "update_log.json"


def _parse_version(value):
    if not value:
        return (0, 0, 0)
    cleaned = str(value).strip().lower()
    cleaned = cleaned.replace('v', '')
    parts = []
    for chunk in cleaned.split('.'):
        digits = ''.join(ch for ch in chunk if ch.isdigit())
        if digits:
            parts.append(int(digits))
    if not parts:
        return (0, 0, 0)
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts[:3])


def _is_newer_version(current, latest):
    return _parse_version(latest) > _parse_version(current)


def _as_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {'1', 'true', 'yes', 'y', 'on', 'required', 'forced'}
    return bool(value)


class AppUpdater:
    @staticmethod
    def get_current_version():
        env_version = os.environ.get('ROADMAPS_APP_CURRENT_VERSION', '').strip()
        if env_version:
            return env_version

        if CURRENT_VERSION_FILE.exists():
            try:
                return CURRENT_VERSION_FILE.read_text(encoding='utf-8').strip() or APP_VERSION
            except Exception:
                return APP_VERSION
        return APP_VERSION

    @staticmethod
    def set_current_version(version):
        APP_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        CURRENT_VERSION_FILE.write_text(str(version).strip(), encoding='utf-8')

    @staticmethod
    def set_test_current_version(version):
        normalized = str(version or '').strip()
        if not normalized:
            return {'success': False, 'message': 'Version is required for testing.'}

        AppUpdater.set_current_version(normalized)
        return {
            'success': True,
            'version': normalized,
            'current_version': AppUpdater.get_current_version(),
            'message': f'Test version set to {normalized}.',
        }

    @staticmethod
    def _read_update_log():
        try:
            if UPDATE_LOG_FILE.exists():
                with UPDATE_LOG_FILE.open('r', encoding='utf-8') as handle:
                    return json.load(handle)
        except Exception:
            pass
        return []

    @staticmethod
    def _write_update_log(entry):
        APP_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        history = AppUpdater._read_update_log()
        history.append(entry)
        with UPDATE_LOG_FILE.open('w', encoding='utf-8') as handle:
            json.dump(history, handle, indent=2)

    @staticmethod
    def check_for_update():
        current_version = AppUpdater.get_current_version()
        try:
            request = urllib.request.Request(RELEASE_API_URL, headers={'User-Agent': 'RoadMaps-App-Updater/1.0'})
            with urllib.request.urlopen(request, timeout=15) as response:
                payload = json.loads(response.read().decode('utf-8'))
        except Exception as exc:
            return {
                'has_update': False,
                'current_version': current_version,
                'latest_version': current_version,
                'is_force_update': False,
                'download_url': '',
                'changelog': '',
                'error': str(exc),
            }

        latest_version = payload.get('version', current_version)
        is_force_update = _as_bool(
            payload.get(
                'is_force_update',
                payload.get('force_update', payload.get('required', False)),
            )
        )
        return {
            'has_update': _is_newer_version(current_version, latest_version),
            'current_version': current_version,
            'latest_version': latest_version,
            'is_force_update': is_force_update,
            'update_type': 'forced' if is_force_update else 'optional',
            'download_url': payload.get('download_url', ''),
            'changelog': payload.get('changelog', ''),
            'sha256': payload.get('sha256', ''),
            'error': None,
        }

    @staticmethod
    def _download_file(url, out_path):
        request = urllib.request.Request(url, headers={'User-Agent': 'RoadMaps-App-Updater/1.0'})
        with urllib.request.urlopen(request, timeout=60) as response, open(out_path, 'wb') as handle:
            shutil.copyfileobj(response, handle)

    @staticmethod
    def _compute_sha256(file_path):
        digest = hashlib.sha256()
        with open(file_path, 'rb') as handle:
            for chunk in iter(lambda: handle.read(65536), b''):
                digest.update(chunk)
        return digest.hexdigest()

    @staticmethod
    def download_and_install_update():
        status = AppUpdater.check_for_update()
        if not status.get('has_update'):
            return {
                'success': False,
                'message': 'No update available.',
                'has_update': False,
                'is_force_update': False,
                'update_type': 'optional',
            }

        download_url = status.get('download_url')
        expected_hash = status.get('sha256', '')
        latest_version = status.get('latest_version')
        current_version = status.get('current_version')

        if not download_url:
            return {
                'success': False,
                'message': 'No download URL for the latest release.',
                'has_update': True,
                'is_force_update': status.get('is_force_update', False),
                'update_type': status.get('update_type', 'optional'),
            }

        APP_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        RELEASES_DIR.mkdir(parents=True, exist_ok=True)
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)

        previous_file = RELEASES_DIR / f'RoadmapsApp-{current_version}.exe'
        if previous_file.exists():
            backup_file = BACKUP_DIR / f'RoadmapsApp-{current_version}.bak.exe'
            shutil.copy2(previous_file, backup_file)

        temp_fd, temp_path = tempfile.mkstemp(prefix='roadmapsapp-update-', suffix='.exe')
        os.close(temp_fd)

        try:
            AppUpdater._download_file(download_url, temp_path)
            actual_hash = AppUpdater._compute_sha256(temp_path)
            if expected_hash and actual_hash.lower() != expected_hash.lower():
                os.remove(temp_path)
                return {
                    'success': False,
                    'message': 'Checksum mismatch. Update cancelled.',
                    'has_update': True,
                    'is_force_update': status.get('is_force_update', False),
                    'update_type': status.get('update_type', 'optional'),
                    'expected_sha256': expected_hash,
                    'actual_sha256': actual_hash,
                }

            target_version_path = RELEASES_DIR / f'RoadmapsApp-{latest_version}.exe'
            if target_version_path.exists():
                target_version_path.unlink()
            shutil.move(temp_path, target_version_path)

            AppUpdater.set_current_version(latest_version)
            AppUpdater._write_update_log({
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                'from_version': current_version,
                'to_version': latest_version,
                'download_url': download_url,
                'sha256': actual_hash,
                'forced': bool(status.get('is_force_update', False)),
                'status': 'installed',
            })

            return {
                'success': True,
                'message': f'Update to version {latest_version} installed successfully.',
                'has_update': True,
                'is_force_update': status.get('is_force_update', False),
                'update_type': status.get('update_type', 'optional'),
                'version': latest_version,
                'install_path': str(target_version_path),
            }
        except Exception as exc:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return {
                'success': False,
                'message': str(exc),
                'has_update': True,
                'is_force_update': status.get('is_force_update', False),
                'update_type': status.get('update_type', 'optional'),
            }

    @staticmethod
    def rollback_last_update():
        current_version = AppUpdater.get_current_version()
        backup_candidates = sorted(BACKUP_DIR.glob(f'RoadmapsApp-{current_version}.bak.exe'))
        if not backup_candidates:
            return {'success': False, 'message': 'No backup available for rollback.'}

        backup_file = backup_candidates[-1]
        target_file = RELEASES_DIR / f'RoadmapsApp-{current_version}.exe'
        if target_file.exists():
            target_file.unlink()
        shutil.copy2(backup_file, target_file)
        return {'success': True, 'message': 'Rollback completed.', 'backup_path': str(backup_file)}

    @staticmethod
    def run_startup_check():
        status = AppUpdater.check_for_update()
        if status.get('has_update'):
            return {
                'status': 'update_available',
                'message': f'New version {status["latest_version"]} is available.',
                **status,
            }
        return {'status': 'up_to_date', 'message': 'App is up to date.', **status}
