# ─────────────────────────────────────────────────────────────────
#  Dynamic Gym — Script de empaquetado con PyInstaller
#
#  Uso:
#    pip install pillow pyinstaller
#    python build_launcher.py
#
#  Genera:  DynamicGym.exe  en la carpeta raíz del proyecto
# ─────────────────────────────────────────────────────────────────

import os
import sys
import subprocess

BASE = os.path.dirname(os.path.abspath(__file__))
PNG  = os.path.join(BASE, "frontend", "src", "assets", "dynamicLogo.png")
ICO  = os.path.join(BASE, "dynamic_gym.ico")


def convertir_icono():
    print("→ Convirtiendo PNG a ICO...")
    try:
        from PIL import Image
    except ImportError:
        print("  [!] Pillow no encontrado. Instalando...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
        from PIL import Image

    if not os.path.isfile(PNG):
        print(f"  [!] No se encontró el logo en: {PNG}")
        sys.exit(1)

    img = Image.open(PNG).convert("RGBA")
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ICO, format="ICO", sizes=sizes)
    print(f"  ✓ ICO generado: {ICO}")


def empaquetar():
    print("→ Ejecutando PyInstaller...")
    try:
        import PyInstaller  # noqa: F401
    except ImportError:
        print("  [!] PyInstaller no encontrado. Instalando...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--windowed",
        "--name",  "DynamicGym",
        "--icon",  ICO,
        "--distpath", BASE,
        "--workpath", os.path.join(BASE, "build_tmp"),
        "--specpath", os.path.join(BASE, "build_tmp"),
        os.path.join(BASE, "launcher.py"),
    ]

    result = subprocess.run(cmd, cwd=BASE)
    if result.returncode == 0:
        exe = os.path.join(BASE, "DynamicGym.exe")
        print(f"\n  ✓ Ejecutable generado: {exe}")
        print("\n  Instrucciones de despliegue:")
        print("  1. cd frontend && npm install && npm run build")
        print("  2. cd servidor && npm install")
        print("  3. Copiá DynamicGym.exe junto a las carpetas 'servidor' y 'frontend'")
        print("  4. Asegurate de que el archivo servidor/.env esté configurado")
        print("  5. Ejecutá DynamicGym.exe → presioná Iniciar")
    else:
        print("\n  [!] PyInstaller terminó con errores.")
        sys.exit(result.returncode)


if __name__ == "__main__":
    convertir_icono()
    empaquetar()
