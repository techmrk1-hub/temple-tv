#!/usr/bin/env python3
import csv
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import requests

BGM_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=397630639&single=true&output=csv"
OUT_DIR = Path("music/remote")
MAP_PATH = OUT_DIR / "bgm-map.json"
AUDIO_EXTS = {".mp3", ".m4a", ".aac", ".wav", ".ogg", ".oga", ".flac", ".opus", ".webm"}

session = requests.Session()
session.headers.update({"User-Agent": "TempleTV-BGM-Sync/1.0"})


def drive_file_id(url: str) -> str:
    for pattern in (r"/file/d/([^/]+)", r"/d/([^/]+)", r"[?&]id=([^&]+)"):
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return ""


def cache_key(url: str) -> str:
    fid = drive_file_id(url)
    if fid:
        return "drive-" + re.sub(r"[^A-Za-z0-9_-]", "", fid)
    return "url-" + hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]


def safe_http_url(url: str) -> bool:
    try:
        p = urlparse(url)
        if p.scheme != "https" or not p.hostname:
            return False
        host = p.hostname.lower()
        if host in {"localhost", "127.0.0.1", "::1", "169.254.169.254"}:
            return False
        return True
    except Exception:
        return False


def direct_url(url: str) -> str:
    p = urlparse(url)
    host = (p.hostname or "").lower()

    if host in {"www.dropbox.com", "dropbox.com"}:
        q = parse_qs(p.query)
        q.pop("dl", None)
        q["raw"] = ["1"]
        return urlunparse(p._replace(query=urlencode(q, doseq=True)))

    if host == "github.com":
        m = re.match(r"^/([^/]+)/([^/]+)/blob/([^/]+)/(.*)$", p.path)
        if m:
            owner, repo, ref, path = m.groups()
            return f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}"

    return url


def download_drive(url: str, destination: Path) -> None:
    import gdown

    result = gdown.download(url=url, output=str(destination), quiet=False, fuzzy=True)
    if not result or not destination.exists() or destination.stat().st_size < 1024:
        raise RuntimeError("Google Drive download failed")


def download_http(url: str, destination: Path) -> None:
    resolved = direct_url(url)
    with session.get(resolved, stream=True, timeout=(20, 180), allow_redirects=True) as r:
        r.raise_for_status()
        ctype = (r.headers.get("content-type") or "").lower()
        if "text/html" in ctype:
            raise RuntimeError(f"URL returned HTML instead of audio ({ctype})")
        with destination.open("wb") as f:
            for chunk in r.iter_content(1024 * 1024):
                if chunk:
                    f.write(chunk)
    if destination.stat().st_size < 1024:
        raise RuntimeError("Downloaded file is empty")


def transcode_to_mp3(source: Path, destination: Path) -> None:
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(source),
        "-vn", "-codec:a", "libmp3lame", "-b:a", "128k",
        "-ar", "44100", "-ac", "2",
        str(destination),
    ]
    subprocess.run(cmd, check=True)
    if not destination.exists() or destination.stat().st_size < 1024:
        raise RuntimeError("FFmpeg did not create a usable MP3")


def fetch_rows():
    r = session.get(BGM_CSV, timeout=30)
    r.raise_for_status()
    return list(csv.DictReader(r.text.splitlines()))


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows = fetch_rows()
    mapping = {}
    active_keys = set()
    failures = []

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)

        for row in rows:
            url = (row.get("MusicURL") or "").strip()
            active = (row.get("Active") or "YES").strip().upper()

            if not url or active != "YES":
                continue

            if not safe_http_url(url):
                failures.append({"url": url, "error": "Only safe HTTPS audio/share links are supported"})
                continue

            key = cache_key(url)
            active_keys.add(key)
            target = OUT_DIR / f"{key}.mp3"

            try:
                if not target.exists() or target.stat().st_size < 1024:
                    source = tmpdir / f"{key}.source"
                    host = (urlparse(url).hostname or "").lower()

                    if host in {"drive.google.com", "drive.usercontent.google.com", "docs.google.com"}:
                        download_drive(url, source)
                    else:
                        download_http(url, source)

                    transcode_to_mp3(source, target)

                mapping[url] = {
                    "path": str(target).replace(os.sep, "/"),
                    "key": key,
                }

            except Exception as exc:
                failures.append({"url": url, "error": str(exc)})
                print(f"WARNING: failed to mirror {url}: {exc}", file=sys.stderr)

    # Remove stale generated audio no longer referenced by active BGM rows.
    for p in OUT_DIR.glob("*.mp3"):
        if p.stem not in active_keys:
            p.unlink()

    payload = {
        "version": 1,
        "source": "BGM Google Sheet",
        "tracks": mapping,
        "failures": failures,
    }

    MAP_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Mirrored {len(mapping)} active BGM track(s).")
    if failures:
        print(f"{len(failures)} track(s) could not be mirrored.", file=sys.stderr)


if __name__ == "__main__":
    main()
