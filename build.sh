#!/bin/bash
echo "Building Fiverr Conversation Extractor..."
cd popup

echo "Building sidepanel..."
npm run build 2>&1

echo "Building dashboard..."
BUILD_TARGET=dashboard npm run build 2>&1

cd ..
rm -rf dist && mkdir -p dist
cp background.js content.js dist/

cp popup/dist/sidepanel.js dist/ 2>/dev/null
cp popup/dist/dashboard.js dist/ 2>/dev/null
cp popup/dist/style.css dist/sidepanel.css 2>/dev/null
cp popup/dist/style.css dist/dashboard.css 2>/dev/null

cat > dist/manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "Fiverr Conversation Extractor",
  "version": "2.0.0",
  "description": "Extract conversations, orders, earnings from Fiverr",
  "permissions": ["activeTab", "storage", "scripting", "downloads", "tabs", "sidePanel"],
  "host_permissions": ["https://www.fiverr.com/*"],
  "side_panel": { "default_path": "sidepanel.html" },
  "background": { "service_worker": "background.js" },
  "content_scripts": [{ "matches": ["https://www.fiverr.com/*"], "js": ["content.js"] }],
  "action": { "default_title": "Open Fiverr Extractor" },
  "web_accessible_resources": [{
    "resources": ["dashboard.html", "dashboard.js", "dashboard.css"],
    "matches": ["<all_urls>"]
  }]
}
EOF

FONT_LINK='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">'

cat > dist/sidepanel.html << EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fiverr Extractor</title>
    $FONT_LINK
    <link rel="stylesheet" href="sidepanel.css">
  </head>
  <body>
    <div id="root"></div>
    <script src="sidepanel.js"></script>
  </body>
</html>
EOF

cat > dist/dashboard.html << EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fiverr Dashboard</title>
    $FONT_LINK
    <link rel="stylesheet" href="dashboard.css">
  </head>
  <body>
    <div id="root"></div>
    <script src="dashboard.js"></script>
  </body>
</html>
EOF

echo "Done! Load dist/ in chrome://extensions/"
