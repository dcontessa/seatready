# SeatReady demo source

A 1920×1080, 30 fps HyperFrames composition, approximately 119 seconds long. It uses real SeatReady application screenshots, a live AI interaction recording, and locally generated Kokoro `af_heart` narration. Payment screenshots show a verified PayPal sandbox test; no real money moved.

## Preview and render

Use Node 26 and FFmpeg. From this directory:

```sh
npx hyperframes@0.9.28 check
npx hyperframes@0.9.28 preview --background
npx hyperframes@0.9.28 render --quality delivery --output renders/seatready-demo.mp4
```

The HTML and bundled assets are sufficient to render. `scripts/build_video.py` was used during authoring to assemble the scenes from the private raw capture directory; raw capture frames are excluded from the repository. Edit the scene HTML directly when using a fresh clone.

`narration.json` contains the voiceover script, `timing.json` contains measured audio durations, and `narration.srt` contains scene-level narration subtitles. There is no copyrighted background music or voice clone. Original app media was captured during this build.

All business data in the film is fictional. The test buyer saw an MYR conversion while the merchant order and verified capture remained USD 447. The film is edited evidence, not an uninterrupted real-time recording.
