import argparse
import os
import sys

import pyttsx3


def choose_voice(engine, preferred):
    if not preferred:
        return
    voices = engine.getProperty("voices") or []
    if preferred.isdigit():
        index = int(preferred)
        if 0 <= index < len(voices):
            engine.setProperty("voice", voices[index].id)
        return
    lowered = preferred.lower()
    for voice in voices:
        voice_id = str(getattr(voice, "id", ""))
        voice_name = str(getattr(voice, "name", ""))
        if lowered in voice_id.lower() or lowered in voice_name.lower():
            engine.setProperty("voice", voice_id)
            return


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", default="")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    text = " ".join((args.text or sys.stdin.read() or "").split()).strip()
    if not text:
        raise SystemExit("Texto vazio para TTS.")

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

    engine = pyttsx3.init()
    engine.setProperty("rate", int(os.getenv("YAMI_PYTTSX3_RATE", "150")))
    engine.setProperty("volume", float(os.getenv("YAMI_PYTTSX3_VOLUME", "0.9")))
    choose_voice(engine, os.getenv("YAMI_PYTTSX3_VOICE", ""))
    engine.save_to_file(text, args.output)
    engine.runAndWait()
    engine.stop()


if __name__ == "__main__":
    main()
