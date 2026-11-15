# Psst demo screenshots

This folder contains 24 original, fictional iPhone-sized screenshots for seeding the Psst demo. The source HTML lives in `src/`; rendered 3× PNGs live in `png/`; `manifest.json` contains the room, searchable text, dates, and importance metadata for each image.

To add the images to an iOS Simulator:

```bash
xcrun simctl addmedia booted demo-screenshots/png/*.png
```

For a physical device, AirDrop the PNGs to the device and save them to Photos. To render one screen again from the repository root:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=demo-screenshots/png/out.png --window-size=393,852 --force-device-scale-factor=3 demo-screenshots/src/01-pottery-flyer.html
```
