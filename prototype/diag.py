from pygdbmi.gdbcontroller import GdbController
import os, time

TARGET = os.path.join(os.path.dirname(os.path.abspath(__file__)), "target.exe")
print("Target:", TARGET)
print("Exists:", os.path.exists(TARGET))

try:
    ctrl = GdbController()
    print("GDB started OK")

    resp = ctrl.write(f"-file-exec-and-symbols {TARGET}", timeout_sec=5)
    print("file-exec responses:")
    for r in resp:
        print(" ", r["type"], r.get("message",""), str(r.get("payload",""))[:80])

    resp2 = ctrl.write("-break-insert main", timeout_sec=5)
    print("break-insert responses:")
    for r in resp2:
        print(" ", r["type"], r.get("message",""), str(r.get("payload",""))[:80])

    ctrl.exit()
    print("Done")

except Exception as e:
    print("ERROR:", type(e).__name__, e)
