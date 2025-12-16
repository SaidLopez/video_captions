
import subprocess
import sys
import os
import time
import webbrowser
import platform
import socket
from pathlib import Path

# Configuration
BACKEND_PORT = 8000
FRONTEND_PORT = 5173
CHECK_INTERVAL_SEC = 2
MAX_RETRIES = 60 # 2 minutes timeout

def print_step(msg):
    print(f"\n[STEP] {msg}")

def print_succ(msg):
    print(f"[SUCCESS] {msg}")

def print_err(msg):
    print(f"[ERROR] {msg}")

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def run_command(command, cwd=None, shell=True):
    try:
        subprocess.check_call(command, cwd=cwd, shell=shell)
    except subprocess.CalledProcessError as e:
        print_err(f"Command failed: {command}")
        sys.exit(1)

def install_python_deps():
    print_step("Installing Python dependencies...")
    run_command([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    print_succ("Python dependencies installed.")

def install_node_deps():
    print_step("Installing Node.js dependencies...")
    frontend_dir = Path("frontend")
    if not (frontend_dir / "node_modules").exists():
        run_command("npm install", cwd="frontend")
        print_succ("Node.js dependencies installed.")
    else:
        print("Node modules already exist. Skipping install (run 'npm install' manually if needed).")

def check_requirements():
    # Check Python
    if sys.version_info < (3, 10):
        print_err("Python 3.10 or higher is required.")
        sys.exit(1)
    
    # Check Node
    try:
        subprocess.check_call(["node", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except:
        print_err("Node.js is not installed. Please install Node.js v18+.")
        sys.exit(1)

    # Check FFmpeg
    try:
        subprocess.check_call(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except:
        print_err("FFmpeg is not installed. This is required for video processing.")
        print("Please install FFmpeg and ensure it is in your PATH.")
        sys.exit(1)

def start_backend():
    print_step("Starting Backend server...")
    if check_port(BACKEND_PORT):
        print("Backend port 8000 is already in use. Assuming backend is running.")
        return None
    
    # Use Popen to run in background
    if platform.system() == "Windows":
        cmd = f"{sys.executable} -m uvicorn app.main:app --host 0.0.0.0 --port {BACKEND_PORT} --reload"
    else:
        cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", str(BACKEND_PORT), "--reload"]
    
    process = subprocess.Popen(
        cmd,
        shell=(platform.system() == "Windows"),
        cwd=os.getcwd()
    )
    return process

def start_frontend():
    print_step("Starting Frontend server...")
    if check_port(FRONTEND_PORT):
        print("Frontend port 5173 is already in use. Assuming frontend is running.")
        return None

    cmd = "npm run dev"
    process = subprocess.Popen(
        cmd,
        cwd="frontend",
        shell=True
    )
    return process

def wait_for_services():
    print_step("Waiting for services to be ready...")
    
    # Wait for Backend
    backend_ready = False
    for i in range(MAX_RETRIES):
        if check_port(BACKEND_PORT):
            backend_ready = True
            break
        time.sleep(CHECK_INTERVAL_SEC)
        print(f"Waiting for backend... ({i+1}/{MAX_RETRIES})")
    
    if not backend_ready:
        print_err("Backend failed to start.")
        return False

    # Wait for Frontend
    # Frontend (Vite) might look like it's listening but still compiling, but usually port open is enough
    frontend_ready = False
    for i in range(MAX_RETRIES):
        if check_port(FRONTEND_PORT):
            frontend_ready = True
            break
        time.sleep(CHECK_INTERVAL_SEC)
        print(f"Waiting for frontend... ({i+1}/{MAX_RETRIES})")
    
    if not frontend_ready:
        print_err("Frontend failed to start.")
        return False
        
    return True

def main():
    print("========================================")
    print("   Video Captions App - Easy Start")
    print("========================================")
    
    check_requirements()
    install_python_deps()
    install_node_deps()
    
    backend_proc = start_backend()
    frontend_proc = start_frontend()
    
    if wait_for_services():
        print_succ("All services are running!")
        print(f"\nOPENING APP AT: http://localhost:{FRONTEND_PORT}\n")
        webbrowser.open(f"http://localhost:{FRONTEND_PORT}")
        
        print("Press Ctrl+C to stop the servers.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping servers...")
    else:
        print_err("Startup failed.")

    # Cleanup
    if backend_proc:
        backend_proc.terminate()
    if frontend_proc:
        # On Windows, terminating the shell doesn't always kill the child
        # On Linux/Mac it's usually fine
        if platform.system() == "Windows":
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_proc.pid)])
        else:
            frontend_proc.terminate()

if __name__ == "__main__":
    main()
