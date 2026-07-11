#!/bin/zsh
set -e
cd "$(dirname "$0")/dist"
open "http://127.0.0.1:4173/"
echo "原型系统已启动：http://127.0.0.1:4173/"
echo "关闭此窗口即可停止服务。"
python3 -m http.server 4173
