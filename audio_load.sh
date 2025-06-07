#!/bin/bash

yt-dlp \
    -f bestaudio \
    --extract-audio \
    --audio-format mp3 \
    -o "$2/%(title)s.%(ext)s" "$1"
