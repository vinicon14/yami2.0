import argparse
import os
import subprocess
import sys
import urllib.request
from pathlib import Path


VOICE_BASE_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"
DEFAULT_VOICE = "pt_BR-faber-medium"


def model_dir() -> Path:
    return Path.home() / ".local" / "share" / "jarvis" / "models" / "piper"


def voice_paths(voice_name: str) -> tuple[Path, Path]:
    root = model_dir()
    return root / f"{voice_name}.onnx", root / f"{voice_name}.onnx.json"


def voice_url(voice_name: str, suffix: str) -> str:
    parts = voice_name.split("-")
    if len(parts) < 3:
        raise RuntimeError(f"Invalid Piper voice name: {voice_name}")
    lang_region = parts[0]
    name = parts[1]
    quality = parts[2]
    lang = lang_region.split("_")[0]
    return f"{VOICE_BASE_URL}/{lang}/{lang_region}/{name}/{quality}/{voice_name}.onnx{suffix}"


def download_once(url: str, target: Path) -> None:
    if target.exists() and target.stat().st_size > 0:
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_suffix(target.suffix + ".tmp")
    with urllib.request.urlopen(url, timeout=120) as response:
        with open(tmp, "wb") as handle:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                handle.write(chunk)
    tmp.replace(target)


def ensure_voice(voice_name: str) -> tuple[Path, Path]:
    model_path, config_path = voice_paths(voice_name)
    download_once(voice_url(voice_name, ""), model_path)
    download_once(voice_url(voice_name, ".json"), config_path)
    return model_path, config_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", default="")
    parser.add_argument("--output", required=True)
    parser.add_argument("--voice", default=os.getenv("YAMI_PIPER_VOICE", DEFAULT_VOICE))
    args = parser.parse_args()

    text = " ".join((args.text or sys.stdin.read() or "").split()).strip()
    if not text:
        raise SystemExit("Texto vazio para TTS.")

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    model_path, config_path = ensure_voice(args.voice)
    cmd = [
        sys.executable,
        "-m",
        "piper",
        "-m",
        str(model_path),
        "-c",
        str(config_path),
        "-f",
        str(output_path),
        "--length-scale",
        os.getenv("YAMI_PIPER_LENGTH_SCALE", "0.65"),
        "--noise-scale",
        os.getenv("YAMI_PIPER_NOISE_SCALE", "0.8"),
        "--noise-w-scale",
        os.getenv("YAMI_PIPER_NOISE_W", "1.0"),
        "--sentence-silence",
        os.getenv("YAMI_PIPER_SENTENCE_SILENCE", "0.2"),
    ]
    subprocess.run(cmd, input=text, text=True, check=True, timeout=60)


if __name__ == "__main__":
    main()
