$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

python -m pip install -r requirements.txt
Set-Location frontend
if (-not (Test-Path node_modules)) {
  npm install
}
npm run build
Set-Location ..
python manage.py migrate
python manage.py seed_data
python manage.py runserver 8001
